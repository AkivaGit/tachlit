# Tachlit Backend API

A complete production-ready Node.js backend API for user management with JWT authentication, role-based authorization, and PostgreSQL database.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Secure password hashing with bcrypt
  - Token expiration and validation

- **User Management**
  - User registration and login
  - Profile management
  - Password change functionality
  - Account deletion

- **Admin Features**
  - View all users with pagination and search
  - User management (enable/disable/delete)
  - Admin dashboard statistics
  - Role management

- **Security**
  - Helmet.js for security headers
  - CORS configuration
  - Rate limiting
  - Input validation and sanitization
  - SQL injection prevention

- **Database**
  - PostgreSQL with connection pooling
  - Automatic table creation and migration
  - Optimized indexes for performance
  - Transaction support

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Yarn package manager

## 🛠️ Local Setup

### 1. Clone and Navigate

```bash
cd server
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE tachlit_db;
```

### 4. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/tachlit_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

### 5. Initialize Database

The database tables will be created automatically when you start the server. Alternatively, you can run the SQL schema manually:

```bash
psql -d tachlit_db -f schema.sql
```

### 6. Start Development Server

```bash
yarn dev
```

The server will start on `http://localhost:3000`

### 7. Verify Installation

Check the health endpoint:

```bash
curl http://localhost:3000/health
```

## 🚀 Deployment on Render

### 1. Prepare for Deployment

Ensure your `package.json` has the correct scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 2. Create Render Web Service

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure the service:
   - **Build Command**: `yarn install`
   - **Start Command**: `yarn start`
   - **Environment**: Node

### 3. Environment Variables

Set the following environment variables in Render:

```
NODE_ENV=production
DATABASE_URL=<your-postgresql-connection-string>
JWT_SECRET=<your-secure-jwt-secret>
JWT_EXPIRES_IN=24h
FRONTEND_URL=<your-frontend-url>
```

### 4. Database Setup

1. Create a PostgreSQL database on Render
2. Copy the connection string to `DATABASE_URL`
3. The tables will be created automatically on first startup

## 📚 API Documentation

### Base URL

- **Local**: `http://localhost:3000`
- **Production**: `https://your-app.onrender.com`

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🔐 Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "YourPassword",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Login User

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "YourPassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Verify Token

**GET** `/api/auth/verify`

Verify if JWT token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "is_active": true
  }
}
```

## 👤 User Endpoints

### Get Current User

**GET** `/api/users/me`

Get current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Profile

**PUT** `/api/users/me`

Update current user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+0987654321"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+0987654321",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Change Password

**PUT** `/api/users/me/password`

Change current user's password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Delete Account

**DELETE** `/api/users/me`

Delete current user's account.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "password": "YourPassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

## 👑 Admin Endpoints

All admin endpoints require admin role.

### Get All Users

**GET** `/api/admin/users`

Get all users with pagination, sorting, and search.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search term for email, first name, or last name
- `sortBy` (optional): Sort field (default: created_at)
- `sortOrder` (optional): ASC or DESC (default: DESC)

**Example:**
```
GET /api/admin/users?page=1&pageSize=20&search=john&sortBy=email&sortOrder=ASC
```

**Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",
        "role": "user",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Get User by ID

**GET** `/api/admin/users/:id`

Get specific user by ID.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User

**PUT** `/api/admin/users/:id`

Update user information.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+0987654321",
  "role": "admin",
  "is_active": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+0987654321",
    "role": "admin",
    "is_active": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Delete User

**DELETE** `/api/admin/users/:id`

Delete user account.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Disable User

**PATCH** `/api/admin/users/:id/disable`

Disable user account.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User disabled successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": false
  }
}
```

### Enable User

**PATCH** `/api/admin/users/:id/enable`

Enable user account.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User enabled successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true
  }
}
```

### Get Statistics

**GET** `/api/admin/stats`

Get admin dashboard statistics.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "stats": {
    "totalUsers": 100,
    "activeUsers": 85,
    "adminUsers": 5,
    "recentUsers": 12,
    "inactiveUsers": 15
  }
}
```

## 🔧 Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## 🧪 Testing

### Example API Calls

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "YourPassword",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "YourPassword"
  }'

# Get current user (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN"

# Get all users (admin only)
curl -X GET "http://localhost:3000/api/admin/users?page=1&pageSize=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 📁 Project Structure

```
server/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Input validation middleware
├── models/
│   └── User.js              # User model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User routes
│   └── admin.js             # Admin routes
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── schema.sql               # Database schema
├── server.js                # Main application file
└── README.md                # This file
```

## 🔒 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Security**: Signed tokens with expiration
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Comprehensive validation and sanitization
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Configurable cross-origin requests
- **Security Headers**: Helmet.js for security headers

## 🚀 Performance Features

- **Connection Pooling**: PostgreSQL connection pooling
- **Database Indexes**: Optimized indexes for queries
- **Pagination**: Efficient pagination for large datasets
- **Caching**: Query result optimization

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team.
