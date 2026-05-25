class MekariController {
  static async healthCheck(req, res, next) {
    return res.status(200).json({
      status: "ok",
      service: "vhp-mekari-integration",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  static async receiveNotificaton(req, res, next) {
    try {
      const payload = req.body;

      if (!payload || Object.keys(payload).length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Request body is required",
          timestamp: new Date().toISOString,
        });
      }

      // TODO:
      // 1. Validate Mekari request
      // 2. Save file/payload
      // 3. Forward to Perseus or save to folder

      return res.status(202).json({
        status: "accepted",
        service: "vhp-mekari-integration",
        message: "Notification received for Perseus processing",
        timestamp: new Date().toISOString,
      });
    } catch (err) {
      console.error("Failed to process Perseus notification:", err);

      return res.status(500).json({
        status: "error",
        service: "vhp-mekari-integration",
        message: "Failed to process notification",
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = MekariController;
