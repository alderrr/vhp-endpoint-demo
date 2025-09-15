const fs = require("fs");
const path = require("path");
const { Buffer } = require("buffer");
const { XMLParser, XMLValidator } = require("fast-xml-parser");
const verifyCredentials = require("../helpers/verification");
const checkReqType = require("../helpers/checkReqType");
const checkToken = require("../helpers/checkToken");
const checkMessageId = require("../helpers/checkMessageId");
const checkMessageAction = require("../helpers/checkMessageAction");
const createResponse = require("../helpers/createResponse");
const drive = process.env.DRIVE;

class Controller {
  static async checkRequest(req, res, next) {
    try {
      const { authorization } = req.headers;
      const xmlBody = req.body;

      console.log(authorization);

      if (!drive) {
        throw new Error();
      }
      if (!authorization) {
        throw new Error("Invalid token");
      }
      const verified = verifyCredentials(authorization);
      if (!verified) {
        throw new Error("Invalid token");
      }
      if (!xmlBody || typeof xmlBody !== "string") {
        throw new Error("Invalid or missing XML body");
      }
      if (XMLValidator.validate(xmlBody) !== true) {
        throw new Error("Malformed XML body");
      }

      const xmlParser = new XMLParser({
        ignoreAttributes: false,
      });
      const jsonObject = xmlParser.parse(xmlBody);
      const hotelCode =
        jsonObject["soap:Envelope"]["OTA_HotelResNotifRQ"]["ReservationsList"][
          "HotelReservation"
        ]["BasicPropertyInfo"]["@_HotelCode"];

      // Decode authorization
      const base64Credentials = authorization.slice(6).trim();
      const decodedSecret = Buffer.from(base64Credentials, "base64").toString(
        "utf-8"
      );
      const userId = decodedSecret.split(":")[0];
      // const hotelcode = decodedSecret.split(":")[1];

      console.log(userId, hotelCode);

      // Getting data from XML
      const fileType = checkReqType(xmlBody);
      const fileMessageId = checkMessageId(xmlBody);
      const fileMessageAction = checkMessageAction(xmlBody);

      const formattedDate = new Date().toISOString().split("T")[0];
      const folderPath = path.join(`${drive}/${userId}/${hotelCode}/raw/`);

      let formattedTime;
      let fileName;
      if (userId === "VHP-CMGRP") {
        formattedTime = new Date()
          .toISOString()
          .replace(/\D/g, "")
          .slice(6, 18);
        fileName = `rsv_${hotelCode}_${formattedTime}.xml`;
      } else {
        formattedTime = Math.floor(
          (Date.now() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) /
            1000
        );
        fileName = `${fileType}_${formattedDate}_${formattedTime}.xml`;
      }
      const filePath = path.join(folderPath, fileName);

      // C:/VHP-RMS/1234/raw
      // C:/VHP-BE/1234/raw
      // C:/VHP-GRP/1234/raw
      // C:/VHP-CM/

      // Creating Folder and File
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      fs.writeFileSync(filePath, xmlBody, "utf-8");

      // Creating Debug Folders
      for (let i = 1; i <= 12; i++) {
        let debugPath = path.join(`${drive}/${userId}/${hotelCode}/debug${i}/`);
        if (!fs.existsSync(debugPath)) {
          fs.mkdirSync(debugPath, { recursive: true });
        }
      }

      // Generating Response Message
      const responseMessage = createResponse(
        userId,
        fileType,
        fileMessageId,
        fileMessageAction
      );

      // Sending Response Message
      res
        .set("Content-Type", "application/soap+xml")
        .status(200)
        .send(responseMessage);
    } catch (error) {
      next(error);
    }
  }
  static async testConnection(req, res, next) {
    // GET METHOD
    try {
      const { authorization } = req.headers;
      let userInfo = null;
      if (authorization) {
        const verified = verifyCredentials(authorization);
        if (verified) {
          const base64Credentials = authorization.slice(6).trim();
          const decodedSecret = Buffer.from(
            base64Credentials,
            "base64"
          ).toString("utf-8");
          const userId = decodedSecret.split(":")[0];
          userInfo = userId;
        }
      } else {
        throw new Error("Invalid token");
      }

      const clientIp =
        req.headers["x-forwarded-for"]?.split(",").shift() ||
        req.socket.remoteAddress;

      const requestHeaders = {
        "user-agent": req.headers["user-agent"],
        accept: req.headers["accept"],
        "content-type": req.headers["content-type"],
      };

      const timestamp = new Date().toISOString();
      const environment = process.env.NODE_ENV || "development";

      const logData = {
        timestamp,
        environment,
        client_ip: clientIp,
        user: userInfo,
        headers: requestHeaders,
      };

      const logsDir = path.join(__dirname, "..", "logs");
      const logFilePath = path.join(logsDir, "test-connection.log");

      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      fs.appendFileSync(
        logFilePath,
        `[${timestamp}] Test connection log:\n${JSON.stringify(
          logData,
          null,
          2
        )}\n\n`
      );

      res.status(200).json({
        status: "200",
        message: "Connection successful. Server is up and running!",
        timestamp: timestamp,
        environment: environment,
        user: userInfo,
        client_ip: clientIp,
        headers: requestHeaders,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;
