const express = require("express");
const fs = require("fs");
const path = require("path");
const { mean } = require("../utils/stats");
const router = express.Router();
const DATA_PATH = path.join(__dirname, "../../../data/items.json");

let statsCache = null;
let cacheTimestamp = null;

// Watch the data file for changes and invalidate cache
try {
  const watcher = fs.watch(DATA_PATH, (eventType, filename) => {
    if (eventType === "change") {
      console.log("Data file changed, invalidating stats cache");
      statsCache = null;
      cacheTimestamp = null;
    }
  });

  watcher.on("error", (error) => {
    console.error("File watcher error:", error);
  });
} catch (err) {
  console.error("Failed to set up file watcher:", err);
}

// Calculate stats from items data
function calculateStats(items) {
  if (!Array.isArray(items)) {
    items = [];
  }

  const prices = items
    .map((item) => item.price || 0)
    .filter((price) => typeof price === "number");

  return {
    total: items.length,
    averagePrice: prices.length > 0 ? mean(prices) : 0,
    cachedAt: new Date().toISOString(),
  };
}

// GET /api/stats
router.get("/", (req, res, next) => {
  // Return cached stats if available
  if (statsCache) {
    return res.json({ ...statsCache, fromCache: true });
  }

  // Calculate and cache stats
  fs.readFile(DATA_PATH, "utf-8", (err, raw) => {
    if (err) {
      if (err.code === "ENOENT") {
        const emptyStats = calculateStats([]);
        return res.json({ ...emptyStats, fromCache: false });
      }
      return next(err);
    }

    try {
      const items = JSON.parse(raw);
      statsCache = calculateStats(items);
      cacheTimestamp = Date.now();
      res.json({ ...statsCache, fromCache: false });
    } catch (parseErr) {
      console.error("Failed to parse items.json:", parseErr);
      const err = new Error("Invalid data file format");
      err.status = 500;
      next(err);
    }
  });
});

module.exports = router;
