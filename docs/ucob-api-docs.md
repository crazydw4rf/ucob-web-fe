# UCOB API Documentation

> **Used Cooking Oil Buying & Selling Platform**  
> A simple college project for trading used cooking oil.

---

## 1. Tech & Architectural Overview

- **Auth Strategy**: **HTTP-only Cookie**. Backend will not return a token in the response body. Backend identifies the `user_id` automatically from the session.
- **Image Storage**: **Signed URL Strategy**. Backend generates a temporary URL for the frontend to upload directly to object storage. Backend only stores the final **Public URL**.
- **Routing Convention**:
  - `/admin/*`: Routes strictly for Admin users (viewing all data, verifying payments).
  - Other routes: Public or for the logged-in user (implicitly filtered by their session).

---

## 2. Database Schema (ERD)

### Tables

#### `users`

| Column       | Data Type    | Notes               |
| :----------- | :----------- | :------------------ |
| `id`         | SERIAL / INT | Primary Key         |
| `first_name` | VARCHAR(100) | Not Null            |
| `last_name`  | VARCHAR(100) | Nullable            |
| `email`      | VARCHAR(255) | Not Null, Unique    |
| `password`   | VARCHAR(255) | Not Null (Hashed)   |
| `role`       | ENUM         | `'ADMIN'`, `'USER'` |
| `created_at` | TIMESTAMP    | Default: `now()`    |

#### `sell_requests`

| Column           | Data Type    | Notes                                    |
| :--------------- | :----------- | :--------------------------------------- |
| `id`             | SERIAL / INT | Primary Key                              |
| `user_id`        | INT          | Foreign Key → `users.id`                 |
| `quantity_liter` | DECIMAL      | Amount of oil to sell                    |
| `pickup_address` | TEXT         | Where the oil should be picked up        |
| `photo_url`      | TEXT         | Public URL of the goods/oil photo        |
| `status`         | ENUM         | `'PENDING'`, `'ACCEPTED'`, `'REJECTED'`  |
| `admin_id`       | INT          | FK → `users.id` (Admin who processed it) |
| `created_at`     | TIMESTAMP    |                                          |

#### `buy_requests`

| Column              | Data Type    | Notes                                        |
| :------------------ | :----------- | :------------------------------------------- |
| `id`                | SERIAL / INT | Primary Key                                  |
| `user_id`           | INT          | Foreign Key → `users.id`                     |
| `quantity_liter`    | DECIMAL      | Amount of oil to buy                         |
| `delivery_address`  | TEXT         | Where the oil should be delivered            |
| `payment_proof_url` | TEXT         | Public URL of the payment proof              |
| `status`            | ENUM         | `'PENDING'`, `'ACCEPTED'`, `'REJECTED'`      |
| `admin_id`          | INT          | FK → `users.id` (Admin who verified payment) |
| `created_at`        | TIMESTAMP    |                                              |

---

#### `prices`

| Column            | Data Type        | Notes           |
| :---------------- | :--------------- | :-------------- |
| `id`              | SERIAL / INT     | Primary Key     |
| `type`            | ENUM prices_type | `SELL` or `BUY` |
| `price_per_liter` | DECIMAL(10,2)    |                 |
| `updated_at`      | TIMESTAMP        |                 |

---

## 3. Global Response Format

### Success (Object/Message)

```json
{
  "success": true,
  "code": 201,
  "data": {
    "message": "resource successfully created"
  }
}
```

### Success (List/Array with Pagination)

**Request**: `GET /sell-requests?skip=0&take=2`

**Response**:

```json
{
  "success": true,
  "code": 200,
  "data": [
    { "id": 1, "quantity_liter": 10 },
    { "id": 2, "quantity_liter": 5 }
  ],
  "meta": {
    "skip": 0,
    "take": 2,
    "total": 45
  }
}
```

### General Error Response

If a request fails, the backend will return a standard error object.

**Response `4xx/5xx`**:

```json
{
  "success": false,
  "code": 400,
  "error": {
    "message": "email already exists",
    "kind": "ResourceConflict"
  }
}
```

**Common `kind` Enum Values**:

- `BadRequest`: Invalid input or missing fields.
- `Unauthorized`: Not logged in or session expired.
- `Forbidden`: Authenticated but lack permission (e.g., User accessing Admin route).
- `NotFound`: Resource (ID) does not exist.
- `ResourceConflict`: Data already exists (e.g., Duplicate email).
- `InternalServerError`: Unexpected server error.

---

## 4. API Endpoints

### Auth & Users

#### `POST /users` (Register)

- **Request Body**:

```json
{
  "first_name": "Ucup",
  "last_name": "Surucup",
  "email": "ucup@xyz.com",
  "password": "mypassword123"
}
```

- **Response `201`**:

```json
{
  "success": true,
  "code": 201,
  "data": "user successfully created"
}
```

#### `POST /auth/login`

- **Request Body**:

```json
{
  "email": "ucup@xyz.com",
  "password": "mypassword123"
}
```

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "first_name": "Ucup",
    "last_name": "Surucup",
    "email": "ucup@xyz.com",
    "role": "USER"
  }
}
```

> Sets `Set-Cookie: token=...; HttpOnly`

#### `POST /auth/logout`

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "message": "logged out successfully"
  }
}
```

> Clears the `token` HttpOnly Cookie

#### `GET /users/me` (Profile)

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "id": 1,
    "first_name": "Ucup",
    "last_name": "Surucup",
    "email": "ucup@xyz.com",
    "role": "USER"
  }
}
```

---

### Upload (Signed URL)

#### `POST /uploads/signed-url`

- **Request Body**:

```json
{
  "transaction_type": "SELL",
  "content_type": "image/jpeg"
}
```

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "upload_url": "https://storage.googleapis.com/ucob-bucket/temp/signed-hash",
    "public_url": "https://storage.googleapis.com/ucob-bucket/uploads/sell/1712654400_photo.jpg"
  }
}
```

---

### User Actions (Personal History)

#### `POST /sell-requests`

- **Request Body**:

```json
{
  "quantity_liter": 12.5,
  "pickup_address": "Jl. Mawar No. 12, Jakarta",
  "photo_url": "https://storage.googleapis.com/ucob-bucket/uploads/sell/1712654400_photo.jpg"
}
```

- **Response `201`**:

```json
{
  "success": true,
  "code": 201,
  "data": { "message": "sell request submitted" }
}
```

#### `GET /sell-requests`

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "id": 101,
      "quantity_liter": 12.5,
      "pickup_address": "Jl. Mawar No. 12, Jakarta",
      "status": "PENDING",
      "created_at": "2026-04-09T10:00:00Z"
    }
  ],
  "meta": { "skip": 0, "take": 10, "total": 1 }
}
```

#### `POST /buy-requests`

- **Request Body**:

```json
{
  "quantity_liter": 5.0,
  "delivery_address": "Jl. Melati No. 5, Bandung",
  "payment_proof_url": "https://storage.googleapis.com/ucob-bucket/uploads/buy/1712654400_proof.jpg"
}
```

- **Response `201`**:

```json
{
  "success": true,
  "code": 201,
  "data": { "message": "buy request submitted" }
}
```

#### `GET /buy-requests`

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "id": 201,
      "quantity_liter": 5.0,
      "delivery_address": "Jl. Melati No. 5, Bandung",
      "status": "ACCEPTED",
      "created_at": "2026-04-08T15:00:00Z"
    }
  ],
  "meta": { "skip": 0, "take": 10, "total": 1 }
}
```

---

### Admin Actions (Dashboard)

#### `GET /admin/sell-requests`

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "id": 101,
      "user": { "id": 1, "first_name": "Ucup" },
      "quantity_liter": 12.5,
      "pickup_address": "Jl. Mawar No. 12, Jakarta",
      "photo_url": "...",
      "status": "PENDING"
    }
  ],
  "meta": { "skip": 0, "take": 10, "total": 150 }
}
```

#### `PATCH /admin/sell-requests/101/verify`

- **Request Body**:

```json
{
  "status": "ACCEPTED"
}
```

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": { "message": "request accepted" }
}
```

#### `GET /admin/buy-requests`

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "id": 201,
      "user": { "id": 2, "first_name": "Budi" },
      "quantity_liter": 5.0,
      "payment_proof_url": "...",
      "status": "PENDING"
    }
  ],
  "meta": { "skip": 0, "take": 10, "total": 80 }
}
```

#### `PATCH /admin/buy-requests/201/verify`

- **Request Body**:

```json
{
  "status": "ACCEPTED"
}
```

- **Response `200`**:

```json
{
  "success": true,
  "code": 200,
  "data": { "message": "payment verified" }
}
```

---

## 5. Summary of Endpoints

| Category    | Method  | Endpoint                          | Access | Description                     |
| :---------- | :------ | :-------------------------------- | :----- | :------------------------------ |
| **Auth**    | `POST`  | `/users`                          | Public | Register new user               |
| **Auth**    | `POST`  | `/auth/login`                     | Public | Login (Sets HttpOnly Cookie)    |
| **Auth**    | `POST`  | `/auth/logout`                    | Auth   | Logout (Clears HttpOnly Cookie) |
| **Profile** | `GET`   | `/users/me`                       | Auth   | Get current user profile        |
| **Upload**  | `POST`  | `/uploads/signed-url`             | Auth   | Get signed URL for image upload |
| **Sell**    | `POST`  | `/sell-requests`                  | User   | Submit new sell request         |
| **Sell**    | `GET`   | `/sell-requests`                  | User   | View personal sell history      |
| **Buy**     | `POST`  | `/buy-requests`                   | User   | Submit new buy request          |
| **Buy**     | `GET`   | `/buy-requests`                   | User   | View personal buy history       |
| **Admin**   | `GET`   | `/admin/sell-requests`            | Admin  | Dashboard: All sell requests    |
| **Admin**   | `PATCH` | `/admin/sell-requests/:id/verify` | Admin  | Approve/Reject a sell request   |
| **Admin**   | `GET`   | `/admin/buy-requests`             | Admin  | Dashboard: All buy requests     |
| **Admin**   | `PATCH` | `/admin/buy-requests/:id/verify`  | Admin  | Approve/Reject a payment        |
