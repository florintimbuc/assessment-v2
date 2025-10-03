const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const router = express.Router();
const DATA_PATH = path.join(__dirname, "../../../data/items.json");

// Utility to read data async
async function readData() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    // If file doesn't exist or is invalid, return empty array
    if (err.code === "ENOENT") {
      return [];
    }

    throw err;
  }
}

// Utility to write data async
async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// GET /api/items
router.get("/", async (req, res, next) => {
  try {
    const data = await readData();
    const { limit, q, page = 1, pageSize = 50 } = req.query;
    let results = data;

    // Apply search filter if provided
    if (q) {
      results = results.filter(
        (item) => item.name && item.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Validate and sanitize pagination parameters
    let pageNum = parseInt(page);
    let pageSizeNum = parseInt(pageSize);

    if (isNaN(pageNum) || pageNum < 1) {
      pageNum = 1;
    }
    if (isNaN(pageSizeNum) || pageSizeNum < 1) {
      pageSizeNum = 50;
    }
    if (pageSizeNum > 1000) {
      pageSizeNum = 1000;
    }

    // Calculate pagination
    const total = results.length;
    const totalPages = Math.ceil(total / pageSizeNum) || 1;

    if (pageNum > totalPages) {
      pageNum = totalPages;
    }

    const start = (pageNum - 1) * pageSizeNum;
    const end = start + pageSizeNum;

    const paginatedResults = results.slice(start, end);

    // Support legacy limit parameter
    let finalResults = paginatedResults;
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        finalResults = paginatedResults.slice(0, limitNum);
      }
    }

    res.json({
      data: finalResults,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get("/:id", async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find((i) => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error("Item not found");
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post("/", async (req, res, next) => {
  try {
    const item = req.body;

    // Basic validation
    if (!item.name || typeof item.name !== "string") {
      const err = new Error("Invalid item: name is required");
      err.status = 400;
      throw err;
    }

    if (item.price !== undefined && typeof item.price !== "number") {
      const err = new Error("Invalid item: price must be a number");
      err.status = 400;
      throw err;
    }

    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await writeData(data);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
