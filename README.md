# Node.js Authentication & Session Management API

A backend authentication and session management system built using **Node.js, Express.js, MongoDB, JWT, and bcrypt**.

This project implements user registration, login, email OTP verification, JWT-based authentication, refresh token rotation, session management, protected routes, and logout functionality.

---

## 🚀 Features

* User Registration
* User Login
* Password Hashing with bcrypt
* Email OTP Verification
* JWT Access Token Authentication
* Refresh Token Authentication
* Refresh Token Rotation
* HttpOnly Cookies
* Refresh Token Hashing in Database
* Session Management
* Protected Routes
* User Profile API
* Logout & Session Revocation
* IP Address Tracking
* User-Agent Tracking
* Token Expiration

---

## 🛠️ Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**
* **JWT**
* **bcrypt**
* **Cookie-parser**
* **dotenv**
* **Morgan**
* **Nodemailer / Gmail SMTP**
* **Postman** for API testing

---

## 📁 Project Structure

```text
Practice_Auth/
│
├── src/
│   ├── config/
│   │   ├── config.js
│   │   └── db.js
│   │
│   ├── controller/
│   │   └── auth.controller.js
│   │
│   ├── middleware/
│   │   └── Auth_middleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   └── OTP.js
│   │
│   ├── routes/
│   │   └── auth.routes.js
│   │
│   ├── utils/
│   │   └── otpEmailTemplate.js
│   │
│   └── app.js
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
├── .env
└── README.md
```

---

# 🔐 Authentication Flow

The project uses two types of JWT tokens:

### Access Token

* Short-lived
* Used to access protected APIs
* Sent through the `Authorization` header
* Expires after a limited period

Example:

```http
Authorization: Bearer <access_token>
```

### Refresh Token

* Long-lived
* Stored inside an HttpOnly cookie
* Used to generate a new access token
* Stored as a bcrypt hash in the database
* Rotated whenever a new access token is generated

---

# 👤 User Registration

Registration flow:

```text
User sends registration data
          ↓
Check existing username/email
          ↓
Hash password using bcrypt
          ↓
Create user
          ↓
Create session
          ↓
Generate refresh token
          ↓
Hash refresh token
          ↓
Store refresh token hash
          ↓
Generate access token
          ↓
Set refresh token in HttpOnly cookie
```

The password is never stored as plain text.

Example password:

```text
password123
```

Stored in database as a bcrypt hash:

```text
$2b$10$................................
```

---

# 📧 Email OTP Verification

The project includes email OTP verification.

Flow:

```text
User Registration
       ↓
Generate OTP
       ↓
Hash OTP
       ↓
Store OTP in MongoDB
       ↓
Send OTP through Email
       ↓
User enters OTP
       ↓
Compare OTP
       ↓
Verify User Email
```

The OTP is hashed before being stored in the database.

---

# 🔑 Login

Login requires:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Login flow:

```text
Email + Password
       ↓
Find User
       ↓
Compare Password using bcrypt
       ↓
Find/Create Session
       ↓
Generate Refresh Token
       ↓
Hash Refresh Token
       ↓
Store Hash in Session
       ↓
Generate Access Token
       ↓
Set Refresh Token Cookie
```

The response contains the access token while the refresh token is stored in an HttpOnly cookie.

---

# 🔄 Refresh Token Rotation

When the access token expires, the refresh token can be used to generate a new access token.

The refresh token is also rotated.

```text
Old Refresh Token
       ↓
Verify JWT
       ↓
Find Session
       ↓
Check Session Status
       ↓
Compare Refresh Token
       ↓
Generate New Access Token
       ↓
Generate New Refresh Token
       ↓
Hash New Refresh Token
       ↓
Update Session
       ↓
Set New Refresh Token Cookie
```

The old refresh token is replaced with the new refresh token hash.

This means the database does not store the refresh token in plain text.

---

# 🍪 HttpOnly Cookie

The refresh token is stored in an HttpOnly cookie.

Example:

```js
res.cookie("refreshToken", refresh_token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
});
```

For local HTTP development, `secure: false` can be used.

In a production HTTPS environment, `secure: true` should be used.

---

# 🗄️ Session Management

Each authenticated session stores information such as:

```text
userId
refreshToken
revoked
userAgent
ip
createdAt
updatedAt
```

Example session concept:

```text
User
 │
 └── Session
      ├── userId
      ├── refreshToken hash
      ├── revoked
      ├── IP address
      └── User-Agent
```

The refresh token is stored as a hash using bcrypt.

---

# 🛡️ Protected Routes

Protected routes use authentication middleware.

Example:

```http
GET /api/auth/profile
```

The client sends:

```http
Authorization: Bearer <access_token>
```

The middleware:

```text
Request
   ↓
Read Authorization Header
   ↓
Extract Bearer Token
   ↓
Verify JWT
   ↓
Get User ID + Session ID
   ↓
Check Session
   ↓
Allow Request
```

If the token is invalid or expired, the request is rejected.

---

# 👤 Profile API

The project includes a protected profile endpoint.

```http
GET /api/auth/profile
```

Authentication:

```http
Authorization: Bearer <access_token>
```

The endpoint returns authenticated user information.

---

# 🚪 Logout

Logout revokes the current session and clears the refresh token cookie.

Flow:

```text
Logout Request
      ↓
Verify Access Token
      ↓
Get Session ID
      ↓
Find Session
      ↓
Read Refresh Token Cookie
      ↓
Compare Refresh Token
      ↓
Set revoked = true
      ↓
Clear Cookie
```

Example response:

```json
{
  "message": "Logout successful"
}
```

---

# 📌 API Endpoints

| Method | Endpoint                  | Authentication    | Description                    |
| ------ | ------------------------- | ----------------- | ------------------------------ |
| POST   | `/api/auth/registered`    | ❌                 | Register a new user            |
| POST   | `/api/auth/login`         | ❌                 | Login user                     |
| GET    | `/api/auth/profile`       | ✅                 | Get authenticated user profile |
| GET    | `/api/auth/refresh-token` | 🍪 Refresh Cookie | Generate new access token      |
| POST   | `/api/auth/logout`        | ✅                 | Logout and revoke session      |

---

# 🧪 API Testing with Postman

The APIs can be tested using **Postman**.

## Register

```http
POST /api/auth/registered
```

Example body:

```json
{
  "username": "saquib",
  "email": "saquib@example.com",
  "password": "password123"
}
```

---

## Login

```http
POST /api/auth/login
```

Example:

```json
{
  "email": "saquib@example.com",
  "password": "password123"
}
```

The response returns an access token.

The refresh token is stored in the cookie.

---

## Profile

```http
GET /api/auth/profile
```

Header:

```http
Authorization: Bearer <access_token>
```

---

## Refresh Token

```http
GET /api/auth/refresh-token
```

The refresh token is automatically read from the cookie.

A new access token and refresh token are generated through token rotation.

---

## Logout

```http
POST /api/auth/logout
```

Required:

```http
Authorization: Bearer <access_token>
```

The refresh token cookie is also used to verify the session.

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_USER=your_email
```

Do not expose these credentials publicly.

Add `.env` to `.gitignore`:

```gitignore
node_modules/
.env
```

---

# 📦 Installation

Clone the repository:

```bash
git clone https://github.com/Mohdsaquib987/Practice_Auth.git
```

Go to the project directory:

```bash
cd Practice_Auth
```

Install dependencies:

```bash
npm install
```

Create your `.env` file and configure the required environment variables.

Start the server:

```bash
npm start
```

For development with nodemon:

```bash
npm run dev
```

The API will run on:

```text
http://localhost:3000
```

---

# 🔒 Security Concepts Implemented

This project covers several practical backend security concepts:

* Password hashing with bcrypt
* JWT authentication
* Access token expiration
* Refresh token expiration
* Refresh token rotation
* Refresh token hashing
* HttpOnly cookies
* Session-based authentication state
* Token verification
* Protected routes
* Email OTP verification
* Session revocation
* Environment variables
* IP tracking
* User-Agent tracking

---

# 📚 What I Learned

While building this project, I learned how a real authentication system works beyond basic login and registration.

I worked with access and refresh tokens, JWT verification, bcrypt password hashing, refresh token rotation, HttpOnly cookies, session management, email OTP verification, protected routes, and logout/session revocation.

I also learned why refresh tokens should not be stored as plain text in the database and how `bcrypt.compare()` can be used to verify a token against its stored hash.

---

# 🔮 Future Improvements

Possible improvements for this project include:

* Multiple device/session management
* Token versioning
* Access token blacklist
* Rate limiting
* Forgot password functionality
* Password reset functionality
* Role-based authorization
* Google OAuth authentication
* Redis-based session management
* Production deployment

---

# 👨‍💻 Author

**Mohd Saquib**

GitHub:
https://github.com/Mohdsaquib987

LinkedIn:
https://linkedin.com/in/mohdsaquib2341
