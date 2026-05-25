const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

class PerseusController {
  static async healthCheck(req, res) {
    return res.status(200).json({
      status: "ok",
      service: "vhp-perseus-integration",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  static async receiveNotification(req, res) {
    try {
      const payload = req.body;
      if (!payload || Object.keys(payload).length === 0) {
        return res.status(400).json({
          status: "error",
          service: "vhp-perseus-integration",
          message: "Request body is required",
          timestamp: new Date().toISOString(),
        });
      }

      const drive = process.env.DRIVE;
      if (!drive) {
        return res.status(500).json({
          status: "error",
          service: "vhp-perseus-integration",
          message: "DRIVE environment variable is not configured",
          timestamp: new Date().toISOString(),
        });
      }

      const folderPath = path.join(drive, "perseus-integration");
      await fs.mkdir(folderPath, { recursive: true });
      const fileName = `notification-${Date.now()}-${crypto.randomUUID()}.json`;
      const filePath = path.join(folderPath, fileName);
      await fs.writeFile(
        filePath,
        JSON.stringify(
          {
            receivedAt: new Date().toISOString(),
            sourceIp: req.ip,
            headers: req.headers,
            body: payload,
          },
          null,
          2,
        ),
        "utf8",
      );

      return res.status(202).json({
        status: "accepted",
        service: "vhp-perseus-integration",
        message: "Notification received for Perseus processing",
        fileName,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to process Perseus notification:", err);

      return res.status(500).json({
        status: "error",
        service: "vhp-perseus-integration",
        message: "Failed to process notification",
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = PerseusController;
