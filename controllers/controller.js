const fs = require("fs");
const path = require("path");

class Controller {
  static async checkRequest(req, res, next) {
    try {
      const xmlBody = req.body;
      const { origin } = req.headers; // Example of headers received

      if (!xmlBody || typeof xmlBody !== "string") {
        return res.status(400).json({
          message: "Invalid or missing XML body",
        });
      }

      const formattedTime = Math.floor(
        (Date.now() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) /
          1000
      );
      const formattedDate = new Date().toISOString().split("T")[0];

      const folderPath = path.join(__dirname, "..", "XML");
      // const fileName = `request_${origin}_${Date.now()}.xml`;
      const fileName = `request_${origin}_${formattedDate}_${formattedTime}.xml`;
      const filePath = path.join(folderPath, fileName);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      fs.writeFileSync(filePath, xmlBody, "utf-8");

      // res.set("Content-Type", "application/xml");
      // res.status(200).send(xmlBody);
      res.status(200).json({
        message: "XML Body Request saved",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;
