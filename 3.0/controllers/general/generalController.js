const { XMLParser } = require("fast-xml-parser");

const { validateXmlBody } = require("../../helpers/xmlParser");
const { extractHotelCode } = require("../../helpers/otaMessage");
const { verifyBasicCredentials } = require("../../helpers/basicAuth");
const {
  saveGeneralReservationXml,
} = require("../../services/general/generalFileService");

const getReservationMessage = (parsedXml) => {
  const envelope = parsedXml.Envelope || parsedXml["soap:Envelope"];
  const body = envelope?.Body || parsedXml.Body || parsedXml;

  const messageKey = Object.keys(body || {}).find(
    (key) =>
      key.includes("OTA_HotelResNotifRQ") ||
      key.includes("OTA_HotelResNotifRS"),
  );

  if (!messageKey) {
    return null;
  }

  return {
    messageKey,
    message: body[messageKey],
  };
};

class GeneralController {
  static async receiveReservation(req, res, next) {
    try {
      const { authorization } = req.headers;
      const xmlBody = req.body;

      if (!process.env.DRIVE) {
        const error = new Error("Missing Environment Variable: Drive");
        error.statusCode = 500;
        throw error;
      }

      const client = verifyBasicCredentials(authorization);

      if (!client) {
        return res.status(401).json({
          statusCode: 401,
          statusDescription: "Unauthorized - Invalid Basic Auth credentials",
          data: "FAILED",
        });
      }

      validateXmlBody(xmlBody);

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        removeNSPrefix: true,
      });

      const parsedXml = parser.parse(xmlBody);
      const reservationMessage = getReservationMessage(parsedXml);

      if (!reservationMessage) {
        return res.status(400).json({
          statusCode: 400,
          statusDescription: "Bad Request - Unsupported reservation XML",
          data: "FAILED",
        });
      }

      const hotelCode = extractHotelCode(reservationMessage.message);

      const savedFile = await saveGeneralReservationXml({
        drive: process.env.DRIVE,
        userId: client.userId,
        hotelCode,
        xmlBody,
      });

      return res.status(202).json({
        statusCode: 202,
        statusDescription: "ACK - Reservation Message Accepted",
        data: "SUCCESS",
        message: {
          endpointType: "reservations",
          otaMessageType: reservationMessage.messageKey,
          userId: client.userId,
          hotelCode: hotelCode || null,
          fileName: savedFile.fileName,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = GeneralController;
