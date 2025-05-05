
🧩 CRM – Node.js + MongoDB Based


---

📚 About

This CRM backend system provides robust APIs for managing candidate accounts, tasks, user roles, statuses, and group information. It includes JWT-based authentication, role-based authorization, and is fully integrated with Rota Cloud for two-way data synchronization. It is designed to support enterprise needs with modular routes, detailed logs, and a structured error-handling system.


---

🔥 Features

🔐 JWT-secured login and registration system
🧑‍💼 Role-based authorization (admin, manager, staff)
📦 CRUD operations for Aday Cari, Tasks, Statuses, Groups, etc.
☁ Rota Cloud integration for syncing customer records
📈 Task and activity reports for users and companies
📊 Paginated list views and search endpoints
🪵 Winston-based logging system
🚨 Centralized error handling with custom API error classes
🧪 Includes test coverage with Jest and Supertest
🌍 Swagger (OpenAPI) docs via api-docs.yaml


---

🧱 Technologies

Node.js (ES Modules)

Express.js

MongoDB + Mongoose

JSON Web Token (JWT)

Winston Logger

Rota Cloud API

dotenv, cors, cookie-parser

Supertest + Jest (for testing)



---

📁 Project Structure

crm/
│
├── controllers/
├── middleware/
├── models/
├── routes/
│   ├── adaycaris.js
│   ├── tasks.js
│   ├── user.js
│   ├── status.js
│   └── ...
│
├── services/
│   └── rotaCloudService.js
│
├── tests/
│   ├── adaycaris.test.js
│   └── tasks.test.js
│
├── utils/
│   └── logger.js
│
├── api-docs.yaml
├── error.js
├── index.js
└── package.json


---

🚀 How to Use

1. Clone the repository:



git clone https://github.com/ItsBurakVatan/crmProject.git
cd crm-backend

2. Install dependencies:



npm install

3. Configure environment variables:



Create a .env file:

PORT=your-port
MONGO=your-url
ROTA_USERNAME=your-username
ROTA_PASSWORD=your-password

4. Start the server:



npm start


---

🧪 Run Tests

npm install --save-dev jest supertest
npm test


---

📝 Notes

Backend is ready to integrate with a React or mobile frontend.

Includes automatic token refresh and rate-limit handling for Rota Cloud.

Can be extended with more modules (e.g., billing, notifications).

Suitable for enterprise CRM workflows with real-time sync.
