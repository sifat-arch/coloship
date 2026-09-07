Courier Management System — Backend

A scalable courier and parcel delivery management backend built with Node.js, Express.js, TypeScript, PostgreSQL, Prisma ORM, Redis, and REST APIs.

The system provides separate workflows for Customers, Couriers, and Administrators, including shipment creation, courier assignment, shipment tracking, payment processing, authentication, email verification, and administrative management.

✨ Features
🔐 Authentication & Authorization
User registration
Email verification
Login / Logout
JWT-based authentication
Refresh token support
Forgot password
Reset password
Role-based authorization
Account status management
Google authentication support
👤 Customer
Create and manage profile
Manage delivery addresses
Create shipments
Select delivery type
Track shipments
View shipment history
Make payments
Cash on Delivery (COD)
🛵 Courier
Courier profile
Vehicle information
Availability management
View assigned shipments
Accept shipment assignments
Update shipment status
Pickup parcels
Complete deliveries
🛡️ Admin
Manage users
Manage couriers
Approve courier accounts
Block / suspend users
Monitor shipments
Manage system activities
📦 Shipment Management

Supported shipment statuses:

CREATED
PAYMENT_PENDING
PAID
PICKUP_REQUESTED
COURIER_ASSIGNED
PICKED_UP
AT_ORIGIN_HUB
IN_TRANSIT
AT_DESTINATION_HUB
OUT_FOR_DELIVERY
DELIVERY_FAILED
CANCELLED
RETURNED
DELIVERED
💳 Payment
bKash payment integration
Cash on Delivery
Payment status tracking
Payment transaction records
Payment failure handling
Refund support
📍 Shipment Tracking

Every important shipment status change can be stored as a tracking event with:

Status
Description
Location
Created by
Timestamp
🛠️ Technology Stack
Technology	Purpose
Node.js	Runtime
Express.js	Backend framework
TypeScript	Programming language
PostgreSQL	Database
Prisma ORM	Database ORM
Redis	Caching / OTP / temporary data
JWT	Authentication
Zod	Request validation
Nodemailer	Email service
bKash	Payment gateway
Cloudinary	File/image storage
Postman	API testing
🏗️ Architecture

The backend follows a modular architecture:

src/
├── app/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── validations/
│   └── utils/
│
├── config/
├── lib/
├── modules/
│   ├── auth/
│   ├── user/
│   ├── courier/
│   ├── shipment/
│   ├── payment/
│   └── admin/
│
├── generated/
│   └── prisma/
│
└── server.ts
🔄 Main Business Flow
Customer Shipment Flow
Register
   ↓
Email Verification
   ↓
Login
   ↓
Create Address
   ↓
Create Shipment
   ↓
Select Payment Method
   ↓
Payment
   ↓
Pickup Requested
   ↓
Courier Assigned
   ↓
Courier Accepts
   ↓
Parcel Picked Up
   ↓
In Transit
   ↓
Out for Delivery
   ↓
Delivered
🚚 Courier Flow
Courier Registration
        ↓
Admin Approval
        ↓
Courier Login
        ↓
Set Availability
        ↓
Receive Shipment Assignment
        ↓
Accept Assignment
        ↓
Pickup Parcel
        ↓
Update Shipment Status
        ↓
Deliver Parcel
        ↓
Mark as Delivered
🛡️ Admin Flow
Admin Login
    ↓
Manage Users
    ↓
Manage Couriers
    ↓
Approve Courier
    ↓
Block / Suspend Users
    ↓
Monitor Shipments
    ↓
Monitor Payments
🔑 API Structure

The API is versioned using:

/api/v1

Example:

/api/v1/auth/login
/api/v1/users/profile
/api/v1/shipments
/api/v1/payments
/api/v1/admin/users
/api/v1/admin/couriers
⚙️ Installation
1. Clone the repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <PROJECT_FOLDER>
2. Install dependencies

Using npm:

npm install

Or pnpm:

pnpm install
3. Configure environment variables

Create a .env file in the root directory:

NODE_ENV=development

PORT=5000

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME"

JWT_ACCESS_SECRET="your_access_secret"
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

Never commit your .env file to GitHub.

🗄️ Database Setup

Generate Prisma Client:

npx prisma generate

Run migrations:

npx prisma migrate dev

For production:

npx prisma migrate deploy
▶️ Run the Project

Development:

npm run dev

Build:

npm run build

Production:

npm start
🧪 API Testing

The APIs can be tested using Postman.

Recommended testing sequence:

1. Register
2. Verify Email
3. Login
4. Get Profile
5. Create Address
6. Create Shipment
7. Initiate Payment
8. Payment Confirmation
9. Courier Assignment
10. Courier Accept
11. Update Shipment Status
12. Track Shipment
13. Complete Delivery
🔒 Security

The API uses:

JWT authentication
Role-based access control
Zod request validation
Password hashing
Protected routes
Environment-based secrets
Authentication middleware
Authorization middleware

Sensitive credentials should always be stored in environment variables.

👥 User Roles

The system currently supports three primary roles:

CUSTOMER
COURIER
ADMIN
CUSTOMER

Can create shipments, manage addresses, make payments, and track parcels.

COURIER

Can manage courier availability, accept shipments, and update delivery statuses.

ADMIN

Can manage users, approve couriers, and perform administrative operations.

💰 Payment Methods

Currently supported:

BKASH
COD

Payment lifecycle:

UNPAID
   ↓
PAYMENT_PENDING
   ↓
PAID

Failed payments can be marked as:

FAILED

Refund-related states are also supported.

📦 Delivery Types
STANDARD
EXPRESS
📊 Database Models

The core database entities include:

User
CourierProfile
Address
Shipment
ShipmentTrackingEvent
Payment
Notification
AuditLog

Relationships are managed using Prisma ORM and PostgreSQL.

🌐 API Response Format

Successful responses follow a consistent structure:

{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {}
}

Error responses:

{
  "success": false,
  "statusCode": 400,
  "message": "Invalid request",
  "error": {}
}
🚀 Future Improvements

Possible future improvements include:

Real-time shipment tracking
WebSocket notifications
Advanced courier assignment algorithm
Route optimization
Delivery zones
Hub management
Automatic courier matching
SMS notifications
Advanced analytics dashboard
Vendor/business accounts
Automated courier earnings settlement
👨‍💻 Author

Sifat Ullah

Backend Developer

Built with ❤️ using Node.js, TypeScript, PostgreSQL and Prisma.