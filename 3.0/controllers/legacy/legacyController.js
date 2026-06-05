const { XMLParser } = require("fast-xml-parser");

const { validateXmlBody } = require("../../helpers/xml/xmlParser");
const { verifyLegacyCredentials } = require("../../helpers/legacy/legacyAuth");
const {
  getLegacyRequestType,
  extractLegacyHotelCode,
  extractSoapMessageId,
  extractSoapAction,
} = require("../../helpers/legacy/legacyMessage");
const {
  buildLegacySoapResponse,
} = require("../../helpers/legacy/legacySoapResponse");
const { saveLegacyXml } = require("../../services/legacy/legacyFileService");

class LegacyController {
  static async handleHtng(req, res, next) {
    try {
      const { authorization } = req.headers;
      const xmlBody = req.body;

      if (!process.env.DRIVE) {
        const error = new Error("Missing Environment Variable: Drive");
        error.statusCode = 500;
        throw error;
      }

      const legacyClient = verifyLegacyCredentials(authorization);

      if (!legacyClient) {
        const error = new Error("Invalid token");
        error.statusCode = 401;
        throw error;
      }

      validateXmlBody(xmlBody);

      const parser = new XMLParser({
        ignoreAttributes: false,
        removeNSPrefix: true,
      });

      const parsedXml = parser.parse(xmlBody);

      const envelope = parsedXml.Envelope || parsedXml["soap:Envelope"];
      const body = envelope?.Body || parsedXml.Body || parsedXml;

      const messageKey = Object.keys(body || {}).find(
        (key) =>
          key.includes("OTA_HotelResNotifRQ") ||
          key.includes("OTA_HotelRatePlanNotifRQ") ||
          key.includes("OTA_HotelAvailNotifRQ") ||
          key.includes("OTA_HotelInvBlockNotifRQ") ||
          key.includes("OTA_HotelInvCountNotifRQ"),
      );

      if (!messageKey) {
        const error = new Error("Unsupported OTA Message Type");
        error.statusCode = 400;
        throw error;
      }

      const message = body[messageKey];
      const hotelCode = extractLegacyHotelCode(message);

      if (!hotelCode) {
        const error = new Error("Cannot extract hotel code from message");
        error.statusCode = 400;
        throw error;
      }

      const fileType = getLegacyRequestType(xmlBody);
      const fileMessageId = extractSoapMessageId(parsedXml);
      const fileMessageAction = extractSoapAction(parsedXml);

      await saveLegacyXml({
        drive: process.env.DRIVE,
        userId: legacyClient.userId,
        hotelCode,
        fileType,
        xmlBody,
      });

      const responseMessage = buildLegacySoapResponse({
        userId: legacyClient.userId,
        fileType,
        fileMessageId,
        fileMessageAction,
      });

      return res
        .set("Content-Type", "application/soap+xml")
        .status(200)
        .send(responseMessage);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LegacyController;
