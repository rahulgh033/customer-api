# Customer API + Public Washrooms API

OAuth-secured REST API built with Node.js, Express, PostgreSQL, Auth0, Swagger, and Render.

This project started as a customer management API and was extended into a civic-tech API using real City of Mississauga public washroom open data.

## Features

- Customer CRUD API
- Public washroom API
- OAuth 2.0 authentication
- JWT validation
- Scope-based authorization
- PostgreSQL database
- Swagger API documentation
- Audit logging with IP tracking
- Real Mississauga open-data import

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Auth0
- Swagger / OpenAPI
- Render
- Postman

## API Documentation

Swagger UI:

```text
/api-docs


Live example:

https://customer-api-79au.onrender.com/api-docs


Customer Endpoints

Method	Endpoint	Description
GET	/customers	Get all customers
GET	/customers/search?name=john	Search customers
POST	/customers	Create customer
PUT	/customers/{customer_id}	Update customer
DELETE	/customers/{customer_id}	Delete customer
Washroom Endpoints
Method	Endpoint	Description
GET	/washrooms	Get all public washrooms
GET	/washrooms?city=Mississauga	Filter washrooms by city
GET	/washrooms/accessible	Get accessible washrooms
GET	/washrooms/{id}	Get washroom by ID

Security

Protected endpoints require OAuth 2.0 bearer tokens.

Scopes used:

read:customers
write:customers
delete:customers
Public Washroom Dataset

Current dataset:

City of Mississauga Public Washrooms

Imported records:

48 public washrooms
Local Setup

Install dependencies:

npm install

Create .env:

DATABASE_URL=your_database_url
AUTH0_AUDIENCE=your_auth0_audience
AUTH0_ISSUER_BASE_URL=your_auth0_issuer_url

Start server:

npm start

Open Swagger locally:

http://localhost:3000/api-docs
Future Roadmap
Nearby washroom search
Map UI with Leaflet and OpenStreetMap
Toronto/Brampton/Oshawa data support
User feedback and ratings
Open/closed status
Community contribution workflow
Author

Rahul G

Proof-of-concept API demonstrating backend development, OAuth security, PostgreSQL integration, Swagger documentation, audit logging, and civic open-data usage.