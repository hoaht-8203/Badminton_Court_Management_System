# Badminton Court Management System (BCMS)

A comprehensive web-based management system for badminton court facilities, built with .NET 8 Web API backend and Next.js frontend.

## 🏸 Overview

The Badminton Court Management System is designed to streamline operations for badminton court facilities, providing complete management of courts, bookings, customers, staff, payments, and more. The system features a modern web interface with real-time updates and comprehensive administrative capabilities.

## ✨ Key Features

### 🏟️ Court Management

- **Court Areas & Courts**: Organize courts into areas with detailed information
- **Pricing Rules**: Flexible pricing based on time slots, days of week, and court types
- **Court Status**: Real-time court availability and status tracking
- **Court Scheduling**: Advanced scheduling with conflict detection

### 📅 Booking System

- **Online Booking**: Customer self-service booking interface
- **Booking Management**: Staff can manage and modify bookings
- **Payment Integration**: Secure payment processing with hold mechanisms
- **Booking History**: Complete booking records and analytics

### 👥 User Management

- **Customer Management**: Customer profiles, booking history, and preferences
- **Staff Management**: Employee records, roles, and permissions
- **Authentication**: Secure JWT-based authentication
- **Role-based Access**: Different access levels for customers, staff, and administrators

### 💰 Financial Management

- **Payment Processing**: Multiple payment methods and gateways
- **Pricing Management**: Dynamic pricing rules and time-based rates
- **Revenue Tracking**: Financial reports and analytics
- **Invoice Generation**: Automated billing and receipts

### 📊 Operations

- **Staff Scheduling**: Shift management and scheduling
- **Inventory Management**: Product and service catalog
- **Activity Logging**: Comprehensive audit trails
- **Email Notifications**: Automated communication system

### 🛍️ Additional Services

- **Product Catalog**: Equipment and merchandise management
- **Service Management**: Additional services like coaching, equipment rental
- **Supplier Management**: Vendor and supplier relationships
- **Inventory Checks**: Stock management and tracking

## 🏗️ Architecture

### Backend (.NET 8 Web API)

- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL with Entity Framework Core
- **Authentication**: JWT Bearer tokens with ASP.NET Core Identity
- **File Storage**: MinIO for object storage
- **Email Service**: SMTP integration with MailKit
- **API Documentation**: Swagger/OpenAPI with Scalar
- **Real-time**: SignalR for live updates

### Frontend (Next.js)

- **Framework**: Next.js 15 with React 19
- **UI Library**: Ant Design (antd)
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS
- **Calendar**: DayPilot Pro for scheduling
- **Real-time**: Microsoft SignalR client

### Infrastructure

- **Database**: PostgreSQL 16
- **Containerization**: Docker Compose
- **File Storage**: MinIO S3-compatible storage
- **Payment Gateway**: SEPA integration

## 🚀 Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm
- PostgreSQL 16
- Docker and Docker Compose (optional)

### Backend Setup

1. **Navigate to the API directory**:

   ```bash
   cd ApiApplication
   ```

2. **Install dependencies**:

   ```bash
   dotnet restore
   ```

3. **Configure database connection**:
   Update `appsettings.json` with your PostgreSQL connection string:

   ```json
   {
     "ConnectionStrings": {
       "DbConnectionString": "Server=localhost;Port=5432;Database=BadmintonCourtManagementSystemDatabase;User Id=postgres;Password=postgres"
     }
   }
   ```

4. **Run database migrations**:

   ```bash
   dotnet ef database update
   ```

5. **Start the API**:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:7000` (or `http://localhost:5000`)

### Frontend Setup

1. **Navigate to the web application directory**:

   ```bash
   cd web-application
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

The web application will be available at `http://localhost:3000`

### Using Docker Compose

1. **Start the database**:

   ```bash
   docker-compose up -d postgres
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=BadmintonCourtManagementSystemDatabase
   ```

## 📁 Project Structure

```
Badminton_Court_Management_System/
├── ApiApplication/                 # .NET 8 Web API Backend
│   ├── Controllers/               # API Controllers
│   ├── Entities/                  # Database Entities
│   ├── Services/                  # Business Logic Services
│   ├── Dtos/                      # Data Transfer Objects
│   ├── Data/                      # Database Context
│   ├── Migrations/                # Entity Framework Migrations
│   └── Templates/                 # Email Templates
├── web-application/               # Next.js Frontend
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   ├── components/           # React Components
│   │   ├── context/              # React Context
│   │   └── types-openapi/        # Generated API Types
│   └── public/                   # Static Assets
└── docker-compose.yml            # Docker Configuration
```

## 🔧 Configuration

### Environment Variables

#### Backend Configuration

- `ConnectionStrings:DbConnectionString` - PostgreSQL connection string
- `JwtOptions:Secret` - JWT signing key
- `EmailOptions:*` - SMTP email configuration
- `Minio:*` - Object storage configuration
- `SEPAY_API_KEY` - Payment gateway API key

#### Frontend Configuration

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SIGNALR_URL` - SignalR hub URL

## 📚 API Documentation

Once the backend is running, you can access the interactive API documentation at:

- **Swagger UI**: `https://localhost:7000/swagger`
- **Scalar**: `https://localhost:7000/scalar/v1`

## 🧪 Development

### Backend Development

```bash
# Run with hot reload
dotnet watch run

# Add new migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update
```

### Frontend Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint and format
npm run lint
npm run format
```

### Generate API Types

```bash
# Generate TypeScript types from OpenAPI spec
npm run gen-types
```

## 🚀 Deployment

### Production Considerations

1. **Database**: Use a managed PostgreSQL service
2. **File Storage**: Configure MinIO or AWS S3
3. **Email**: Set up production SMTP service
4. **Security**: Use strong JWT secrets and HTTPS
5. **Monitoring**: Implement logging and monitoring

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of a Capstone Project for Fall 2025. Please refer to your institution's guidelines for usage and distribution.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the API documentation for technical details

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **Current** - Development version with ongoing features

---

**Built with ❤️ for efficient badminton court management**
