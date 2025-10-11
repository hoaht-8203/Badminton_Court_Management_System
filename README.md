# Badminton Court Management System

A comprehensive web-based management system designed for badminton court facilities. This system streamlines operations including court bookings, staff management, inventory tracking, and payment processing.

## Overview

The Badminton Court Management System provides a complete solution for managing badminton court facilities with features for both administrators and customers. Built with modern web technologies, it offers a user-friendly interface for handling day-to-day operations efficiently.

## Key Features

- **Court Management**: Manage multiple courts, court areas, and pricing rules
- **Booking System**: Real-time court booking with scheduling and availability tracking
- **Staff Management**: Employee records, shift scheduling, salary management, and attendance tracking
- **Customer Management**: Customer profiles and booking history
- **Inventory Management**: Track products, categories, suppliers, and inventory checks
- **Payment Processing**: Handle payments with support for multiple payment methods
- **User Authentication**: Secure role-based access control with JWT authentication
- **Reporting**: Salary reports, booking analytics, and business insights

## Technology Stack

### Backend (API)
- **.NET Core**: Web API framework
- **Entity Framework Core**: ORM for database operations
- **ASP.NET Identity**: User authentication and authorization
- **PostgreSQL**: Primary database
- **SignalR**: Real-time communication
- **MinIO**: File storage service
- **JWT**: Token-based authentication

### Frontend (Web Application)
- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **Ant Design**: UI component library
- **TailwindCSS**: Utility-first CSS framework
- **React Query**: Data fetching and state management
- **SignalR Client**: Real-time updates
- **DayPilot**: Scheduling and calendar components

## Project Structure

```
.
├── ApiApplication/          # .NET Core Web API backend
│   ├── Controllers/        # API endpoints
│   ├── Entities/          # Database models
│   ├── Services/          # Business logic
│   ├── Data/              # Database context
│   └── ...
├── web-application/        # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── services/      # API client services
│   │   └── types-openapi/ # Auto-generated API types
│   └── ...
└── docker-compose.yml     # Docker configuration for PostgreSQL
```

## Getting Started

### Prerequisites

- .NET 8.0 SDK or later
- Node.js 20.x or later
- PostgreSQL 16.0 or later
- Docker (optional, for running PostgreSQL)

### Backend Setup

1. Navigate to the API directory:
   ```bash
   cd ApiApplication
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Update the database connection string in `appsettings.json`

4. Apply database migrations:
   ```bash
   dotnet ef database update
   ```

5. Run the API:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:5001` (or `http://localhost:5000`)

### Frontend Setup

1. Navigate to the web application directory:
   ```bash
   cd web-application
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.example`

4. Generate API types:
   ```bash
   npm run gen-types
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

### Database Setup (Using Docker)

Run PostgreSQL using Docker Compose:

```bash
docker-compose up -d
```

## Configuration

### Backend Configuration

Configure the API in `ApiApplication/appsettings.json`:
- Database connection strings
- JWT settings
- Email service configuration
- MinIO file storage settings

### Frontend Configuration

Configure the web application in `web-application/.env.local`:
- API base URL
- Environment-specific settings

## Development

### Code Generation

The frontend uses OpenAPI Generator to create TypeScript types from the backend API:

```bash
cd web-application
npm run gen-types
```

### Linting and Formatting

Frontend code quality tools:

```bash
npm run lint        # Run ESLint
npm run lint:fix    # Auto-fix linting issues
npm run format      # Format code with Prettier
```

## License

This project is proprietary software. All rights reserved.

## Contributors

- Hoang Anh Tuan (hoaht-8203)
