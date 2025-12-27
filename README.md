# Apadbandhav Backend API

NestJS-based backend for the Apadbandhav AIoT Accident Detection and Emergency Response Platform.

## Features

- **Authentication**: OTP-based phone authentication with JWT tokens
- **User Management**: User profiles, preferences, and settings
- **Device Management**: Register and manage AIoT devices
- **Emergency Contacts**: Store and manage emergency contacts per device
- **Alert System**: Real-time accident alerts from AIoT devices
- **Insurance Storage**: Store health, vehicle, and term insurance details

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeORM** - Database ORM
- **PostgreSQL** - Database
- **Passport JWT** - Authentication
- **Swagger** - API documentation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure your database and JWT settings in `.env`

4. Start PostgreSQL and create the database:
```sql
CREATE DATABASE apadbandhav;
```

5. Run the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

Once running, visit: `http://localhost:3000/api/docs`

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/signup` - Register new user
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Devices
- `POST /api/devices` - Register new device
- `GET /api/devices` - Get all devices for user
- `GET /api/devices/:id` - Get device details
- `PATCH /api/devices/:id` - Update device
- `PATCH /api/devices/:id/location` - Update device location
- `DELETE /api/devices/:id` - Delete device

### Alerts
- `POST /api/alerts` - Create new alert (from AIoT)
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/stats` - Get alert statistics
- `GET /api/alerts/:id` - Get alert by ID
- `PATCH /api/alerts/:id/status` - Update alert status

## Database Schema

### Users
- id, fullName, email, phone, profilePhoto
- hospitalPreference, accidentAlerts, smsNotifications, locationTracking

### Devices
- id, name, code (16-digit), type, status
- latitude, longitude, address
- healthInsurance, vehicleInsurance, termInsurance
- userId (FK)

### Emergency Contacts
- id, name, relation, phone
- deviceId (FK)

### Alerts
- id, type, status, severity
- latitude, longitude, address, notes
- deviceId (FK)
- createdAt, resolvedAt

## AIoT Integration

The AIoT device should send alerts to:
```
POST /api/alerts
{
  "deviceCode": "1234567890123456",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Connaught Place, New Delhi",
  "type": "accident",
  "severity": "high"
}
```

## License

Private - All Rights Reserved
