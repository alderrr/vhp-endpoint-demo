const { parseXml } = require("../../helpers/xmlParser");
const {
  getRootMessage,
  getMessageMeta,
  extractHotelCode,
  extractEchoToken,
} = require("../../helpers/otaMessage");
const { saveAmadeusXml } = require("../../services/amadeus/amadeusFileService");

class AmadeusController {
  static async healthCheck(req, res) {
    return res.status(200).json({
      status: "ok",
      service: "vhp-amadeus-integration",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  static async handleOtaMessage(req, res, next) {
    try {
      const { messageType } = req.params;
      const userId = req.user?.sub;
      const xmlBody = req.body;

      if (!userId) {
        return res.status(401).json({
          statusCode: 401,
          statusDescription: "Unauthorized - Invalid token payload",
          data: "FAILED",
        });
      }

      const parsedXml = parseXml(xmlBody);
      const { rootName, rootData } = getRootMessage(parsedXml);
      const messageMeta = getMessageMeta(messageType, rootName);
      const echoToken = extractEchoToken(rootData);

      let hotelCode = null;

      if (messageMeta.requiresHotelCode) {
        hotelCode = extractHotelCode(rootData);

        if (!hotelCode) {
          return res.status(400).json({
            statusCode: 400,
            statusDescription: "Bad Request - HotelCode not found in XML",
            data: "FAILED",
          });
        }
      }

      const savedFile = await saveAmadeusXml({
        drive: process.env.DRIVE,
        userId,
        hotelCode,
        direction: messageMeta.direction,
        filePrefix: messageMeta.filePrefix,
        echoToken,
        xmlBody,
      });

      return res.status(202).json({
        statusCode: 202,
        statusDescription: "ACK - Message Accepted",
        data: "SUCCESS",
        message: {
          endpointType: messageType,
          otaMessageType: rootName,
          direction: messageMeta.direction,
          userId,
          hotelCode,
          echoToken,
          fileName: savedFile.fileName,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AmadeusController;
