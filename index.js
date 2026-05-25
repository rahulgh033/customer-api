
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.send("Customer API running");
});

app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM customers ORDER BY id"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/customers", async (req, res) => {
  try {
    const {
      customer_id,
      business_name,
      customer_name,
      address,
      phone,
      email,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO customers
      (
        customer_id,
        business_name,
        customer_name,
        address,
        phone,
        email
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        customer_id,
        business_name,
        customer_name,
        address,
        phone,
        email,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

app.put("/customers/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;

    const {
      business_name,
      customer_name,
      address,
      phone,
      email,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE customers
      SET
        business_name = $1,
        customer_name = $2,
        address = $3,
        phone = $4,
        email = $5
      WHERE customer_id = $6
      RETURNING *
      `,
      [
        business_name,
        customer_name,
        address,
        phone,
        email,
        customer_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});