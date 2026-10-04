# 🚀 ColoShip Backend API Roadmap & Specification

এই ডকুমেন্টটি **ColoShip Delivery System Backend**-এর পূর্ণাঙ্গ API নির্দেশিকা। ফ্রন্টএন্ড শুরু করার আগে এবং একটি পরিপূর্ণ ডেলিভারি অ্যাপ্লিকেশন (যেমন: Pathao, RedX, Steadfast) তৈরি করতে যে যে নতুন API তৈরি করতে হবে, তা বিস্তারিতভাবে নিচে সংজ্ঞায়িত করা হলো।

---

## 📌 সংক্ষেপ সূচিপত্র (Implementation Phases)

| Phase | ফোকাস এরিয়া | গুরুত্ব | বিবরণ |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Core Frontend Blockers** | 🔴 জরুরি | Fee Calculator, Admin All Shipments, Notification, Address CRUD, Profile Update |
| **Phase 2** | **Courier & Rider Operations** | 🟠 উচ্চ | Courier Dashboard, Task Accept/Reject, Proof of Delivery (OTP), Failed Reasons |
| **Phase 3** | **COD Settlement & Analytics** | 🟡 মাঝারি | Cash on Delivery (COD) Deposit, Merchant Payout, Admin Dashboard Metrics |
| **Phase 4** | **Customer Experience & Extras** | 🟢 অপশনাল | Invoice/Label Print, Ratings & Reviews, Bulk Shipments |

---

## 🔴 Phase 1: Core Frontend Blockers (অতি জরুরি API)

### ১. শিপমেন্ট মডিউল (Shipment Module)

#### ১.১. ডেলিভারি ফি ক্যালকুলেটর (Fare Estimation)
- **Method & Route:** `POST /api/v1/shipments/calculate-fee`
- **Access Role:** Public অথবা Authenticated Customer
- **উদ্দেশ্য:** পার্সেল সাবমিট করার আগেই ফ্রন্টএন্ডে রিয়েল-টাইমে মোট চার্জ দেখানো।
- **Request Body:**
```json
{
  "weight": 2.5,
  "deliveryType": "EXPRESS", // "STANDARD" | "EXPRESS"
  "codAmount": 1500,
  "pickupDistrict": "Dhaka",
  "deliveryDistrict": "Chittagong"
}
```
- **Response Structure:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Delivery fee estimated successfully",
  "data": {
    "baseFee": 120,
    "weightCharge": 40,
    "codFee": 15,
    "totalDeliveryFee": 175,
    "currency": "BDT",
    "estimatedDays": "24-48 Hours"
  }
}
```

#### ১.২. শিপমেন্ট এডিট API
- **Method & Route:** `PATCH /api/v1/shipments/:id`
- **Access Role:** `CUSTOMER` (নিজের শিপমেন্ট হতে হবে)
- **শর্ত:** শিপমেন্টটি যদি `CREATED` অথবা `PAYMENT_PENDING` অবস্থায় থাকে, তবেই এডিট করা যাবে। কুরিয়ার পিকআপ করে নিলে এডিট বন্ধ থাকবে।
- **Request Body (Partial Update):**
```json
{
  "deliveryAddressId": "uuid-here",
  "parcelDescription": "Handle with care - Fragile glassware",
  "codAmount": 2000
}
```

---

### ২. অ্যাডমিন শিপমেন্ট ম্যানেজমেন্ট (Admin Shipments)

#### ২.১. সকল শিপমেন্ট লিস্ট ও অ্যাডভান্সড ফিল্টার
- **Method & Route:** `GET /api/v1/admin/shipments`
- **Access Role:** `ADMIN`
- **Query Parameters:** `page`, `limit`, `status`, `deliveryType`, `startDate`, `endDate`, `searchTerm` (tracking number, customer phone, receiver phone)
- **Response Structure:**
```json
{
  "success": true,
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "totalPages": 12
  },
  "data": [
    {
      "id": "uuid",
      "trackingNumber": "CLS-20260904-A89F",
      "status": "IN_TRANSIT",
      "customer": { "name": "John Doe", "email": "john@example.com" },
      "courier": { "phone": "017XXXXXXXX", "user": { "name": "Rider Karim" } },
      "deliveryFee": 120,
      "codAmount": 1500,
      "createdAt": "2026-09-27T10:00:00.000Z"
    }
  ]
}
```

#### ২.২. হাব স্ট্যাটাস আপডেট (Hub Tracking Override)
- **Method & Route:** `PATCH /api/v1/admin/shipments/:id/status`
- **Access Role:** `ADMIN`
- **উদ্দেশ্য:** পার্সেল যখন সেন্ট্রাল হাব বা এরিয়া হাবে পৌঁছায়, তখন স্ট্যাটাস আপডেট করা।
- **Request Body:**
```json
{
  "status": "AT_ORIGIN_HUB", // AT_DESTINATION_HUB, RETURNED, etc.
  "location": "Tejgaon Central Hub, Dhaka",
  "description": "Parcel arrived at Tejgaon Central sorting hub"
}
```

---

### ৩. নোটিফিকেশন মডিউল (Notification Module)
*(নোট: ডাটাবেজ স্কিমাতে `Notification` মডেল আছে, কিন্তু কোনো API তৈরি ছিল না)*

#### ৩.১. ইউজার নোটিফিকেশন লিস্ট
- **Method & Route:** `GET /api/v1/notifications`
- **Access Role:** `CUSTOMER`, `COURIER`, `ADMIN`
- **Query Params:** `page`, `limit`, `isRead` (optional boolean)

#### ৩.২. আনরিড নোটিফিকেশন কাউন্ট (Unread Count)
- **Method & Route:** `GET /api/v1/notifications/unread-count`
- **Access Role:** Authenticated User
- **উদ্দেশ্য:** ফ্রন্টএন্ডের হেডার বেল আইকনে লাল ব্যাজ কাউন্ট দেখানো।
- **Response:**
```json
{
  "success": true,
  "data": { "unreadCount": 5 }
}
```

#### ৩.৩. নোটিফিকেশন রিড হিসেবে মার্ক করা
- **Method & Route:** `PATCH /api/v1/notifications/:id/read`
- **Method & Route (সবগুলো একসাথে):** `PATCH /api/v1/notifications/mark-all-read`

---

### ৪. অ্যাড্রেস ও ইউজার প্রোফাইল মডিউল

#### ৪.১. অ্যাড্রেস আপডেট ও ডিলিট
- **Update Address:** `PATCH /api/v1/addresses/:id`
- **Delete Address (Soft Delete):** `DELETE /api/v1/addresses/:id`
- **Set Default Address:** `PATCH /api/v1/addresses/:id/set-default` (পিকআপ ফর্ম ওপেন করার সাথে সাথে ইউজারের ডিফল্ট অ্যাড্রেস সিলেক্টেড থাকবে)

#### ৪.২. ইউজার প্রোফাইল ও সিকিউরিটি
- **Update Profile:** `PATCH /api/v1/user/profile` (নাম, ফোন, বিজনেসের নাম)
- **Change Password:** `PATCH /api/v1/user/change-password`
```json
{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewStrongPassword456@"
}
```

---

## 🟠 Phase 2: Courier & Rider Operations (রাইডার অ্যাপের API)

### ১. কুরিয়ার ড্যাশবোর্ড ও টাস্ক ম্যানেজমেন্ট

#### ১.১. কুরিয়ার ড্যাশবোর্ড সামারি (Daily Stats)
- **Method & Route:** `GET /api/v1/courier/dashboard-stats`
- **Access Role:** `COURIER`
- **Response:**
```json
{
  "success": true,
  "data": {
    "activeTasks": 3,
    "completedToday": 8,
    "pendingCashToDeposit": 7500, // হাতে জমা থাকা COD ক্যাশ
    "todayEarnings": 480
  }
}
```

#### ১.২. টাস্ক রেসপন্স (Accept / Reject)
- **Method & Route:** `PATCH /api/v1/courier/assignments/:id/respond`
- **Access Role:** `COURIER`
- **Request Body:**
```json
{
  "action": "ACCEPT" // বা "REJECT", রিজেক্ট করলে reason দিতে হবে
}
```

#### ১.৩. ফেইল্ড ডেলিভারি রিপোর্ট (Delivery Failure)
- **Method & Route:** `POST /api/v1/courier/assignments/:id/fail`
- **Access Role:** `COURIER`
- **Request Body:**
```json
{
  "reason": "CUSTOMER_UNREACHABLE", // "WRONG_ADDRESS", "CUSTOMER_REFUSED", "RESCHEDULED"
  "note": "Called 4 times, phone was switched off",
  "rescheduleDate": "2026-09-28" // optional
}
```

#### ১.৪. প্রুফ অফ ডেলিভারি (OTP বা Signature Verification)
- **Method & Route:** `POST /api/v1/courier/assignments/:id/verify-delivery`
- **Access Role:** `COURIER`
- **উদ্দেশ্য:** ডেলিভারি ফ্রড প্রতিরোধ করতে।
- **Request Body:**
```json
{
  "otp": "489201", // পার্সেল পৌঁছানোর পর প্রাপকের এসএমএস/ইমেইলে পাঠানো OTP
  "collectedAmount": 1500, // COD টাকা বুঝে নেওয়া হলো কিনা
  "signatureUrl": "https://..." // optional
}
```

---

## 🟡 Phase 3: COD Settlement & Financial Flow (টাকা পয়সার হিসাব)

### ১. ক্যাশ অন ডেলিভারি (COD) ডিপোজিট ও পে-আউট

#### ১.১. কুরিয়ার টু হাব ক্যাশ জমা (COD Handover)
- **Method & Route:** `POST /api/v1/admin/settlements/courier-deposit`
- **Access Role:** `ADMIN`
- **উদ্দেশ্য:** কুরিয়ার দিনের শেষে সংগৃহীত COD ক্যাশ অ্যাডমিন বা হাব ম্যানেজারের কাছে জমা দিলে তা ভেরিফাই ও রেকর্ড করা।
- **Request Body:**
```json
{
  "courierId": "courier-uuid",
  "amount": 12500,
  "shipmentIds": ["uuid-1", "uuid-2", "uuid-3"],
  "note": "Cash received by Tejgaon Hub Manager"
}
```

#### ১.২. মার্চেন্ট পে-আউট (Merchant Payout Disbursal)
- **Method & Route:** `POST /api/v1/admin/settlements/merchant-payout`
- **Access Role:** `ADMIN`
- **উদ্দেশ্য:** মার্চেন্টের ডেলিভারি হওয়া পণ্যের COD টাকা (ডেলিভারি চার্জ কেটে) মার্চেন্টের বিকাশ বা ব্যাংক একাউন্টে পাঠানো।
- **Request Body:**
```json
{
  "merchantId": "user-uuid",
  "payableAmount": 28400,
  "paymentMethod": "BKASH", // "BANK_TRANSFER"
  "transactionId": "TRX987456321",
  "shipmentIds": ["uuid-1", "uuid-2"]
}
```

### ২. অ্যাডমিন এনালিটিক্স ও ড্যাশবোর্ড মেট্রিক্স
- **Method & Route:** `GET /api/v1/admin/dashboard/overview`
- **Access Role:** `ADMIN`
- **Response Structure:**
```json
{
  "success": true,
  "data": {
    "totalShipments": 1450,
    "deliveredShipments": 1280,
    "inTransitShipments": 85,
    "cancelledShipments": 85,
    "successRate": "88.2%",
    "totalRevenue": 245000,
    "totalCodCollected": 1280000,
    "pendingMerchantPayouts": 95000,
    "activeCouriers": 18
  }
}
```

---

## 🟢 Phase 4: Customer Experience & Value-Add (পরবর্তী ধাপ)

1. **প্রিন্ট লেবেল / ইনভয়েস API:**
   - `GET /api/v1/shipments/:id/invoice` — পার্সেলের ওপর লাগানোর জন্য বারকোড/কিউআর কোডসহ প্রিন্ট লেবেল ডাটা।
2. **কুরিয়ার রেটিং ও রিভিউ API:**
   - `POST /api/v1/shipments/:id/review` — ডেলিভারির পর গ্রাহক ডেলিভারি অভিজ্ঞতা ১-৫ স্টার রেট করবে।
3. **বাল্ক শিপমেন্ট ইমপোর্ট:**
   - `POST /api/v1/shipments/bulk-import` — মার্চেন্টরা এক্সেল বা সিএসভি শিট আপলোড করে একসাথে ৫০+ পার্সেল তৈরি করতে পারবে।

---

## 🛠️ ফাইল ও ফোল্ডার তৈরির গাইডলাইন

আপনার বিদ্যমান কোডবেসের আর্কিটেকচার অনুযায়ী নিচের ফাইলগুলো যোগ করা সুপারিশকৃত:

```
src/app/module/
├── notification/
│   ├── notification.controller.ts
│   ├── notification.route.ts
│   ├── notification.service.ts
│   └── notification.interface.ts
├── settlement/ (বা payment মডিউলের ভেতরে)
│   ├── settlement.controller.ts
│   ├── settlement.route.ts
│   └── settlement.service.ts
```

এছাড়াও:
- `src/app.ts`-এ `NotificationRoutes` মাউন্ট করা।
- `shipment.route.ts` এবং `shipment.service.ts`-এ `calculateFee` যুক্ত করা।
- `admin.route.ts` এবং `admin.service.ts`-এ `getAllShipments` ও `getDashboardOverview` যুক্ত করা।
