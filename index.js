
require("dotenv").config();
const { auth, requiredScopes } = require("express-oauth2-jwt-bearer");
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

async function logAudit(req, actionType, customerId) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  const clientName =
    req.auth?.payload?.azp ||
    req.auth?.payload?.sub ||
    "unknown-client";

  await pool.query(
    `
    INSERT INTO customer_audit_log
    (
      action_type,
      customer_id,
      performed_by,
      ip_address,
      client_name
    )
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      actionType,
      customerId,
      clientName,
      ip,
      clientName
    ]
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.send("Customer API running *** built by rahul g - for proof of concept mock API");
});

app.get("/customers/search", checkJwt, requiredScopes("read:customers"), async (req, res) => {
  try {

    const { name } = req.query;

    const result = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE
        customer_name ILIKE $1
        OR business_name ILIKE $1
      `,
      [`%${name}%`]
    );

await logAudit(req, "CUSTOMER-NAME-SEARCH", name);


    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Search failed"
    });

  }
});

app.get("/customers", checkJwt,  requiredScopes("read:customers"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM customers ORDER BY id"
    );

await logAudit(req, "CUSTOMER-ALL-SEARCH", "ALL CUSTOMERS");

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/customers", checkJwt, requiredScopes("write:customers"), async (req, res) => {
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

await logAudit(req, "CUSTOMER-INSERT", customer_id);


    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

app.put("/customers/:customer_id", checkJwt, requiredScopes("write:customers"), async (req, res) => {
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

await logAudit(req, "CUSTOMER-UPDATE", customer_id);


    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/customers/:customer_id", checkJwt, requiredScopes("delete:customers"), async (req, res) => {
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

await logAudit(req, "CUSTOMER-DELETE", customer_id);


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