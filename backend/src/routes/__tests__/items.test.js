const request = require("supertest");
const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const itemsRouter = require("../items");

// Create test app
const app = express();
app.use(express.json());
app.use("/api/items", itemsRouter);

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

const DATA_PATH = path.join(__dirname, "../../../../data/items.json");
let originalData;

// Backup and restore data
beforeAll(async () => {
  try {
    const data = await fs.readFile(DATA_PATH, "utf-8");
    originalData = data;
  } catch (err) {
    originalData = "[]";
  }
});

afterAll(async () => {
  if (originalData) {
    await fs.writeFile(DATA_PATH, originalData, "utf-8");
  }
});

beforeEach(async () => {
  // Reset data to a known state
  const testData = [
    { id: 1, name: "Item One", price: 10 },
    { id: 2, name: "Item Two", price: 20 },
    { id: 3, name: "Item Three", price: 30 },
    { id: 4, name: "Test Product", price: 40 },
    { id: 5, name: "Another Item", price: 50 },
  ];
  await fs.writeFile(DATA_PATH, JSON.stringify(testData, null, 2), "utf-8");
});

describe("GET /api/items", () => {
  it("should return all items with pagination metadata", async () => {
    const res = await request(app).get("/api/items");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(5);
    expect(res.body.pagination.total).toBe(5);
  });

  it("should filter items by search query", async () => {
    const res = await request(app).get("/api/items?q=test");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toContain("Test");
  });

  it("should filter items case-insensitively", async () => {
    const res = await request(app).get("/api/items?q=ITEM");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(
      res.body.data.every((item) => item.name.toLowerCase().includes("item"))
    ).toBe(true);
  });

  it("should paginate results correctly", async () => {
    const res = await request(app).get("/api/items?page=1&pageSize=2");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(2);
    expect(res.body.pagination.totalPages).toBe(3);
  });

  it("should return second page correctly", async () => {
    const res = await request(app).get("/api/items?page=2&pageSize=2");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].id).toBe(3);
  });

  it("should support legacy limit parameter", async () => {
    const res = await request(app).get("/api/items?limit=3");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it("should combine search and pagination", async () => {
    const res = await request(app).get("/api/items?q=item&page=1&pageSize=2");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(
      res.body.data.every((item) => item.name.toLowerCase().includes("item"))
    ).toBe(true);
  });

  it("should handle invalid page parameter (NaN)", async () => {
    const res = await request(app).get("/api/items?page=abc");

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1); // Should default to 1
  });

  it("should handle negative page parameter", async () => {
    const res = await request(app).get("/api/items?page=-5");

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1); // Should default to 1
  });

  it("should handle zero page parameter", async () => {
    const res = await request(app).get("/api/items?page=0");

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1); // Should default to 1
  });

  it("should handle invalid pageSize parameter", async () => {
    const res = await request(app).get("/api/items?pageSize=xyz");

    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(50); // Should default to 50
  });

  it("should handle negative pageSize parameter", async () => {
    const res = await request(app).get("/api/items?pageSize=-10");

    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(50); // Should default to 50
  });

  it("should handle zero pageSize parameter", async () => {
    const res = await request(app).get("/api/items?pageSize=0");

    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(50); // Should default to 50
  });

  it("should cap very large pageSize to maximum", async () => {
    const res = await request(app).get("/api/items?pageSize=10000");

    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(1000); // Should cap at 1000
  });

  it("should handle page number exceeding total pages", async () => {
    const res = await request(app).get("/api/items?page=999&pageSize=2");

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBeLessThanOrEqual(
      res.body.pagination.totalPages
    );
    expect(res.body.data.length).toBeGreaterThan(0); // Should return last page
  });

  it("should handle empty search results", async () => {
    const res = await request(app).get("/api/items?q=nonexistentitem");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it("should handle invalid limit parameter gracefully", async () => {
    const res = await request(app).get("/api/items?limit=invalid");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /api/items/:id", () => {
  it("should return a specific item by id", async () => {
    const res = await request(app).get("/api/items/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("name", "Item One");
    expect(res.body).toHaveProperty("price", 10);
  });

  it("should return 404 for non-existent item", async () => {
    const res = await request(app).get("/api/items/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("not found");
  });

  it("should handle invalid id format", async () => {
    const res = await request(app).get("/api/items/abc");

    expect(res.status).toBe(404);
  });
});

describe("POST /api/items", () => {
  it("should create a new item successfully", async () => {
    const newItem = { name: "New Item", price: 99 };
    const res = await request(app).post("/api/items").send(newItem);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("New Item");
    expect(res.body.price).toBe(99);

    // Verify item was actually saved
    const getRes = await request(app).get(`/api/items/${res.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe("New Item");
  });

  it("should reject item without name", async () => {
    const invalidItem = { price: 50 };
    const res = await request(app).post("/api/items").send(invalidItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name is required");
  });

  it("should reject item with empty name", async () => {
    const invalidItem = { name: "", price: 50 };
    const res = await request(app).post("/api/items").send(invalidItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name is required");
  });

  it("should reject item with non-string name", async () => {
    const invalidItem = { name: 123, price: 50 };
    const res = await request(app).post("/api/items").send(invalidItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name is required");
  });

  it("should reject item with non-numeric price", async () => {
    const invalidItem = { name: "Test", price: "expensive" };
    const res = await request(app).post("/api/items").send(invalidItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("price must be a number");
  });

  it("should accept item with name only (price optional)", async () => {
    const newItem = { name: "Item Without Price" };
    const res = await request(app).post("/api/items").send(newItem);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Item Without Price");
  });

  it("should generate unique IDs for items", async () => {
    const item1 = { name: "Item 1", price: 10 };
    const item2 = { name: "Item 2", price: 20 };

    const res1 = await request(app).post("/api/items").send(item1);
    const res2 = await request(app).post("/api/items").send(item2);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.id).not.toBe(res2.body.id);
  });
});
