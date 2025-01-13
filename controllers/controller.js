const fs = require("fs");
const path = require("path");
const verifyCredentials = require("../helpers/verification");
const checkReqType = require("../helpers/checkReqType");
const checkMessageId = require("../helpers/checkMessageId");
const createResponse = require("../helpers/createResponse");

class Controller {
  static async checkRequest(req, res, next) {
    try {
      const { requestor_id, client_id, client_secret } = req.headers;
      const xmlBody = req.body;

      // Input Validation
      if (!requestor_id) {
        throw new Error("Missing requestor_id in headers");
      }
      if (!client_id || !client_secret) {
        throw new Error("Missing client_id or client_secret in headers");
      }
      const verified = verifyCredentials(client_id, client_secret);
      if (!verified) {
        throw new Error("Invalid client_id or client_secret");
      }
      if (!xmlBody || typeof xmlBody !== "string") {
        throw new Error("Invalid or missing XML body");
      }

      // Getting data from XML
      const fileType = checkReqType(xmlBody);
      const fileMessageId = checkMessageId(xmlBody);

      // Creating File Name
      const formattedTime = Math.floor(
        (Date.now() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) /
          1000
      );
      const formattedDate = new Date().toISOString().split("T")[0];
      const folderPath = path.join(__dirname, "..", `XML/${client_id}/raw/`);
      let fileName = "";
      if (!fileType) {
        fileName = `Request_Body_${formattedDate}_${formattedTime}.xml`;
      } else {
        fileName = `${fileType}_${formattedDate}_${formattedTime}.xml`;
      }
      const filePath = path.join(folderPath, fileName);

      // Creating Folder and File
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      fs.writeFileSync(filePath, xmlBody, "utf-8");

      // Generating Response Message
      const responseMessage = createResponse(
        requestor_id,
        fileType,
        fileMessageId
      );

      // Sending Response Message
      res.status(200).send(responseMessage);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;
