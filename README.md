# 📦 Coloship — Backend

> A scalable courier and parcel delivery management backend built with Node.js, Express.js, TypeScript, PostgreSQL, Prisma ORM, Redis, and REST APIs.

---

## 📖 About The Project

**Coloship Backend** is the core server-side architecture powering the Coloship logistics and parcel delivery platform. It provides separate, secure workflows for **Customers**, **Couriers**, and **Administrators**, handling everything from shipment creation and tracking to courier assignment, bKash payment integration, and role-based access control.

---

## 🔍 Overview

- **Architecture:** Modular architecture with clear separation of routes, controllers, services, and validation layers.
- **Role-Based Workflows:** Tailored operations and permissions for customers, couriers, and administrators.
- **Security:** JWT-based authentication, role-based authorization, and type-safe request validation using Zod.
- **Data Management:** PostgreSQL with Prisma ORM for reliable relational data management.
- **Performance:** Redis integration for caching, OTP management, and temporary data storage.

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- User registration and email verification.
- Login and logout with JWT-based authentication.
- Access and refresh token support.
- Forgot password and reset password functionality.
- Role-based authorization and account status management.
- Google authentication support.

### 👤 Customer Portal

- Manage user profiles and delivery addresses.
- Create and manage shipments.
- Select delivery types, including Standard and Express.
- Track shipments with detailed event history.
- Make payments through bKash and Cash on Delivery (COD).

### 🚚 Courier Portal

- Manage courier profiles and vehicle information.
- Control courier availability and status.
- View assigned shipments.
- Accept or decline shipment assignments.
- Update shipment status throughout the delivery process.
- Handle pickups and complete deliveries.

### 🛡️ Admin Portal

- Manage users and couriers.
- Review and approve courier accounts and verification documents.
- Block or suspend user accounts.
- Monitor platform activities and payment records.

### 📦 Shipment Management & Tracking

**Supported shipment statuses:**

`CREATED`, `PAYMENT_PENDING`, `PAID`, `PICKUP_REQUESTED`, `COURIER_ASSIGNED`, `PICKED_UP`, `AT_ORIGIN_HUB`, `IN_TRANSIT`, `AT_DESTINATION_HUB`, `OUT_FOR_DELIVERY`, `DELIVERY_FAILED`, `CANCELLED`, `RETURNED`, `DELIVERED`.

- Maintain shipment status throughout the delivery lifecycle.
- Record tracking events for important shipment updates.
- Include status descriptions, locations, timestamps, and event authors in tracking history.

### 💳 Payment & File Management

- **bKash Integration:** Online payment processing and transaction management.
- **Cash on Delivery:** Support for COD-based shipment payments.
- **Payment Handling:** Transaction records and payment failure handling.
- **Cloudinary Integration:** Cloud storage for profile images and courier verification documents.
- **Email Notifications:** Email delivery using Nodemailer.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript Runtime |
| Express.js | Backend Web Framework |
| TypeScript | Type Safety |
| PostgreSQL | Relational Database |
| Prisma ORM | Database Access and ORM |
| Redis | Caching and Temporary Data Management |
| JWT | Authentication and Session Management |
| Zod | Request and Data Validation |
| Nodemailer | Email Notifications |
| bKash | Payment Gateway |
| Cloudinary | File and Image Storage |
| Postman | API Testing |

---

## 🚀 Installation & Setup Guide

### 1. Clone the Repository

Replace the repository URL below with your actual GitHub repository URL.

```bash
git clone https://github.com/sifat-arch/coloship.git
cd coloship
```

### 2. Install Dependencies

Using npm:

```bash
npm install
```

Alternatively, if the project uses pnpm:

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root directory and configure the required environment variables.

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME"

JWT_ACCESS_SECRET="your_access_secret"

# Configure these only if your application uses refresh-token secrets
JWT_REFRESH_SECRET="your_refresh_secret"

REDIS_URL="your_redis_url"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email"
SMTP_PASS="your_app_password"

BKASH_APP_KEY="your_bkash_app_key"
BKASH_APP_SECRET="your_bkash_app_secret"
BKASH_USERNAME="your_bkash_username"
BKASH_PASSWORD="your_bkash_password"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

**Important:**
- Replace placeholder values with your actual credentials.
- Configure only the environment variables required by your application.
- Ensure PostgreSQL and Redis are accessible before starting the server.
- Never commit your `.env` file or expose API keys, passwords, or authentication secrets on GitHub.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Database Migrations

For development:

```bash
npx prisma migrate dev
```

For production:

```bash
npx prisma migrate deploy
```

Make sure your database connection is configured correctly before running migrations.

### 6. Run the Project

Start the development server:

```bash
npm run dev
```

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

> **Note:** The commands above assume these scripts are defined in your `package.json`. Use the actual scripts configured in your project.

---

## 📁 Project Structure

The following structure illustrates the main application modules and supporting layers.

```text
src/
├── app/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── validations/
│   └── utils/
├── config/
├── lib/
├── modules/
│   ├── auth/
│   ├── user/
│   ├── courier/
│   ├── shipment/
│   ├── payment/
│   └── admin/
├── generated/
│   └── prisma/
└── server.ts
```

---

## 🔌 API Documentation

Explore and test the API endpoints using Postman.

👉 **Postman API Documentation:** [Add your published Postman documentation URL here](https://www.postman.com/)

### Core API Route Prefixes

| Endpoint | Description |
|---|---|
| `/api/v1/auth/*` | Authentication and session management |
| `/api/v1/users/*` | User profiles and account information |
| `/api/v1/shipments/*` | Shipment creation, management, and tracking |
| `/api/v1/payments/*` | Payment processing and payment gateways |
| `/api/v1/admin/users/*` | Administrative user management |
| `/api/v1/admin/couriers/*` | Courier approval and management |

> **Note:** These are route prefixes for reference. Check the actual routes implemented in your application for the complete endpoint list.

---

## 🧪 Recommended API Testing Sequence

The following sequence can help you test the main shipment workflow in Postman:

1. Register a user.
2. Verify the user's email.
3. Log in and obtain authentication tokens.
4. Retrieve the user profile.
5. Create a delivery address.
6. Create a shipment.
7. Initiate payment or select Cash on Delivery.
8. Confirm payment when applicable.
9. Assign a courier.
10. Accept the shipment assignment as a courier.
11. Update the shipment status.
12. Track the shipment.
13. Complete the delivery.

The exact sequence may vary depending on shipment status requirements, authorization rules, and payment configuration.

---

## 📫 Author & Support

If you have any questions, suggestions, or collaboration opportunities, feel free to reach out.

- **Developer:** Sifat Ullah
- **Role:** Backend Developer
- **Email:** [sifatullah1004@gmail.com](mailto:sifatullah1004@gmail.com)
- **LinkedIn:** Sifat Ullah
- **GitHub:** [@sifat-arch](https://github.com/sifat-arch)
- **Location:** Mymensingh, Bangladesh

---

Built with ❤️ using Node.js, TypeScript, PostgreSQL, and Prisma ORM.
