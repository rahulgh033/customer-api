
require("dotenv").config();
const { auth } = require("express-oauth2-jwt-bearer");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.send("Customer API running");
});

app.get("/customers", checkJwt, async (req, res) => {
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

app.post("/customers", checkJwt, async (req, res) => {
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

app.put("/customers/:customer_id", checkJwt, async (req, res) => {
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

app.delete("/customers/:customer_id", checkJwt, async (req, res) => {
  try {
    const { customer_id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM customers
      WHERE customer_id = $1
      RETURNING *
      `,
      [customer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    res.json({
      message: "Customer deleted successfully",
      deletedCustomer: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Delete failed",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});