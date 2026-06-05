const fs = require("fs");
const path = require("path");

class AmadeusController {
  static async healthCheck(req, res) {
    return res.status(200).json({
      status: "ok",
      service: "vhpamadeus",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  static async handleInventory(req, res) {}
}
