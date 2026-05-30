
require("dotenv").config();
const { auth, requiredScopes } = require("express-oauth2-jwt-bearer");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

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

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Customer API *** built by rahul g - for proof of concept mock API",
      version: "1.0.0",
      description: "Secure OAuth Customer Management API"
    },
    servers: [
      {
        url: "https://customer-api-79au.onrender.com"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./index.js"]
};

const specs = swaggerJsdoc(options);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
);

app.get("/", (req, res) => {
  res.send("Customer API running *** built by rahul g - for proof of concept mock API");
});

/**
 * @swagger
 * /customers/search:
 *   get:
 *     summary: Search customers
 *     description: Search by customer name or business name
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer or business name
 *     responses:
 *       200:
 *         description: Matching customers returned
 */

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

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */

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

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create customer
 *     description: Creates a new customer record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_id:
 *                 type: string
 *               business_name:
 *                 type: string
 *               customer_name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer created successfully
 */

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
/**
 * @swagger
 * /customers/{customer_id}:
 *   put:
 *     summary: Update customer
 *     description: Updates customer details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_name:
 *                 type: string
 *               customer_name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 */
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
        business_name = COALESCE($1, business_name),
        customer_name = COALESCE($2, customer_name),
        address = COALESCE($3, address),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email)
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
/**
 * @swagger
 * /customers/{customer_id}:
 *   delete:
 *     summary: Delete customer
 *     description: Deletes a customer record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 */
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

/**
 * @swagger
 * /washrooms:
 *   get:
 *     summary: Get all public washrooms
 *     description: Returns public washrooms. Optionally filter by city.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter washrooms by city
 *     responses:
 *       200:
 *         description: List of public washrooms
 */

app.get("/washrooms", checkJwt, requiredScopes("read:customers"), async (req, res) => {
  try {
    const { city } = req.query;

    let result;

    if (city) {
      result = await pool.query(
        `
        SELECT *
        FROM public_washrooms
        WHERE city ILIKE $1
        ORDER BY name
        `,
        [`%${city}%`]
      );
    } else {
      result = await pool.query(
        `
        SELECT *
        FROM public_washrooms
        ORDER BY city, name
        `
      );
    }

if (city) {
  await logAudit(req, "WASHROOM-CITY-SEARCH", city);
} else {
  await logAudit(req, "WASHROOM-ALL-SEARCH", "ALL_WASHROOMS");
}

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch washrooms" });
  }
});

/**
 * @swagger
 * /washrooms/accessible:
 *   get:
 *     summary: Get accessible washrooms
 *     description: Returns washrooms marked as accessible.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accessible washrooms returned successfully
 */

app.get("/washrooms/accessible", checkJwt, requiredScopes("read:customers"), async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM public_washrooms
      WHERE accessible = true
      ORDER BY city, name
      `
    );

await logAudit(req, "WASHROOM-ACCESSIBLE-SEARCH", "ACCESSIBLE_ONLY");


    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch accessible washrooms" });
  }
});

/**
 * @swagger
 * /washrooms/nearby:
 *   get:
 *     summary: Find nearby washrooms
 *     description: Returns public washrooms closest to a latitude/longitude point.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: User latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: User longitude
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of nearby washrooms to return
 *     responses:
 *       200:
 *         description: Nearby washrooms returned successfully
 */
app.get("/washrooms/nearby", checkJwt, requiredScopes("read:customers"), async (req, res) => {
  try {
    const { lat, lng, limit } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: "lat and lng are required. Example: /washrooms/nearby?lat=43.5890&lng=-79.6441"
      });
    }

    const maxResults = limit || 5;

    const result = await pool.query(
      `
      SELECT
        id,
        source_id,
        name,
        address,
        city,
        latitude,
        longitude,
        accessible,
        hours,
        open_season,
        source_url,
        created_at,
        (
          6371 * acos(
            cos(radians($1)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(latitude))
          )
        ) AS distance_km
      FROM public_washrooms
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
      ORDER BY distance_km
      LIMIT $3
      `,
      [
        parseFloat(lat),
        parseFloat(lng),
        parseInt(maxResults)
      ]
    );

    await logAudit(req, "WASHROOM-NEARBY-SEARCH", `lat=${lat},lng=${lng}`);

    res.json(result.rows);

  } catch (err) {
    console.error("Nearby washroom search error:", err.message);

    res.status(500).json({
      error: "Failed to fetch nearby washrooms",
      details: err.message
    });
  }
});


/**
 * @swagger
 * /washrooms/{id}:
 *   get:
 *     summary: Get washroom by ID
 *     description: Returns one public washroom by database ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Washroom ID
 *     responses:
 *       200:
 *         description: Washroom returned successfully
 *       404:
 *         description: Washroom not found
 */

app.get("/washrooms/:id", checkJwt, requiredScopes("read:customers"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM public_washrooms
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Washroom not found" });
    }

await logAudit(req, "WASHROOM-READ-BY-ID", id);


    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch washroom" });
  }
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});