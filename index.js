const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const customers = [
  {
    id: "CUST-1001",
    businessName: "BITBPM Tech Solutions",
    customerName: "Rahul G",
    address: "123 Kariya Dr, Mississauga, ON",
    phone: "416-555-1234",
    email: "rahulg@bitbpm.com"
  }
];

app.get("/", (req, res) => {
  res.send("Customer API is running");
});

app.get("/customers", (req, res) => {
  res.json(customers);
});

app.get("/customers/:id", (req, res) => {
  const customer = customers.find(c => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }
  res.json(customer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});