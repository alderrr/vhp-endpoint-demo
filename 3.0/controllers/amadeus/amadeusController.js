const { parseXml } = require('../../helpers/xmlParser');
const {
  getRootMessage,
  getMessageMeta,
  extractHotelCode,
  extractEchoToken,
} = require('../../helpers/otaMessage');
const {
  extractRawReservationNumber,
  getOtaLogDetails,
} = require('../../helpers/otaLog');
const { appendAmadeusLog } = require('../../services/amadeus/amadeusFileService');

class AmadeusController {
  static async healthCheck(req, res) {
    return res.status(200).json({
      status: 'ok',
      service: 'vhp-integration-webservice',
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
          statusDescription: 'Unauthorized - Invalid token payload',
          data: 'FAILED',
        });
      }

      // Preserve the existing XML validation, endpoint validation and HotelCode rules.
      const parsedXml = parseXml(xmlBody);
      const { rootName, rootData } = getRootMessage(parsedXml);
      const messageMeta = getMessageMeta(messageType, rootName);

      let hotelCode = null;
      if (messageMeta.requiresHotelCode) {
        hotelCode = extractHotelCode(rootData);
        if (!hotelCode) {
          return res.status(400).json({
            statusCode: 400,
            statusDescription: 'Bad Request - HotelCode not found in XML',
            data: 'FAILED',
          });
        }
      }

      // Reservation Number: original PMS ResID_Value with ResID_Type=10.
      // This is only meaningful for OTA_HotelResNotifRS, never other OTA messages.
      const reservationNumber =
        rootName === 'OTA_HotelResNotifRS'
          ? extractRawReservationNumber(rootData)
          : null;

      // Classify the OTA XML response, not the HTTP acknowledgement itself.
      const { status, warnings, errors } = getOtaLogDetails({
        direction: messageMeta.direction,
        rootData,
      });

      // Append one human-readable entry to the user/hotel's daily .log file.
      // Keep the raw EchoToken in the log, even when it contains ':' or '#'.
      const savedFile = await appendAmadeusLog({
        drive: process.env.DRIVE,
        userId,
        hotelCode,
        direction: messageMeta.direction,
        messageType,
        rootName,
        reservationNumber,
        echoToken: rootData?.EchoToken ?? null,
        status,
        warnings,
        errors,
        xmlBody,
      });

      // 202 means the XML was accepted and appended to disk, not that its
      // OTA business response was successful. Keep the previous API contract.
      return res.status(202).json({
        statusCode: 202,
        statusDescription: 'ACK - Message Accepted',
        data: 'SUCCESS',
        message: {
          endpointType: messageType,
          otaMessageType: rootName,
          direction: messageMeta.direction,
          userId,
          hotelCode,
          echoToken: extractEchoToken(rootData),
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
