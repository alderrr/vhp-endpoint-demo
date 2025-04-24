const fs = require("fs");
const path = require("path");
const { Buffer } = require("buffer");
const verifyCredentials = require("../helpers/verification");
const checkReqType = require("../helpers/checkReqType");
const checkMessageId = require("../helpers/checkMessageId");
const createResponse = require("../helpers/createResponse");
const drive = process.env.DRIVE;

class Controller {
  static async checkRequest(req, res, next) {
    try {
      const { client_id, client_secret } = req.headers;
      const xmlBody = req.body;

      // Input Validation
      if (!drive) {
        throw new Error();
      }
      if (!client_id || !client_secret) {
        throw new Error("Invalid client_id or client_secret");
      }
      const verified = verifyCredentials(client_id, client_secret);
      if (!verified) {
        throw new Error("Invalid client_id or client_secret");
      }
      if (!xmlBody || typeof xmlBody !== "string") {
        throw new Error("Invalid or missing XML body");
      }

      // Decode client secret
      const decodedSecret = Buffer.from(client_secret, "base64").toString(
        "utf-8"
      );
      const userId = decodedSecret.split(":")[0];

      // Getting data from XML
      const fileType = checkReqType(xmlBody);
      const fileMessageId = checkMessageId(xmlBody);

      // Creating File Name
      const formattedTime = Math.floor(
        (Date.now() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) /
          1000
      );
      const formattedDate = new Date().toISOString().split("T")[0];
      const folderPath = path.join(`${drive}/${userId}/${client_id}/raw/`);
      const fileName = `${fileType}_${formattedDate}_${formattedTime}.xml`;
      const filePath = path.join(folderPath, fileName);

      // Creating Folder and File
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      fs.writeFileSync(filePath, xmlBody, "utf-8");

      // Creating Debug Folders
      for (let i = 1; i <= 12; i++) {
        let debugPath = path.join(`${drive}/${userId}/${client_id}/debug${i}/`);
        if (!fs.existsSync(debugPath)) {
          fs.mkdirSync(debugPath, { recursive: true });
        }
      }

      // Generating Response Message
      const responseMessage = createResponse(userId, fileType, fileMessageId);

      // Sending Response Message
      res.status(200).send(responseMessage);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;
