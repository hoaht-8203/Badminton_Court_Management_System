# Installation Guides

## 2. Installation Guides

### 2.1 System Requirements

- **Operating System**: Windows 10/11 Professional 64-bit, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Processor**: Intel® Core™ i5 or equivalent, AMD Ryzen 5 or equivalent
- **RAM**: 8.00GB minimum (16GB recommended)
- **Storage**: 20GB free disk space
- **Network**: Internet connection for downloading dependencies

**Required Software:**

- Git v2.40+ (for version control)
- .NET 8.0 SDK
- Node.js v20+ and npm v10+
- PostgreSQL v16.0
- Python v3.10+ (for Face Liveness Service)
- Visual Studio 2022 or Visual Studio Code (for backend development)
- Visual Studio Code (for frontend development)

### 2.2 Installation Instructions

#### 2.2.1 Install Git

- Download and install Git from: https://git-scm.com/downloads
- Follow the installation wizard, accepting default options
- Verify installation by opening a terminal/command prompt and running:
  ```bash
  git --version
  ```

#### 2.2.2 Clone the Repository

- Open a terminal/command prompt
- Navigate to your desired project directory
- Clone the repository using Git:
  ```bash
  git clone <repository-url>
  cd Badminton_Court_Management_System
  ```
- Replace `<repository-url>` with the actual Git repository URL

#### 2.2.3 Install PostgreSQL Database

- Download and install PostgreSQL version 16.0 from:
  https://www.postgresql.org/download/
- During installation:
  - Remember the password you set for the `postgres` user (default username is `postgres`)
  - Note the port number (default is `5432`)
  - Complete the installation wizard
- Verify installation by opening pgAdmin or running:
  ```bash
  psql --version
  ```

#### 2.2.4 Create Database

- Open pgAdmin or use PostgreSQL command line
- Create a new database named `BadmintonCourtManagementSystemDatabase`
- Alternatively, use the following SQL command:
  ```sql
  CREATE DATABASE "BadmintonCourtManagementSystemDatabase";
  ```

#### 2.2.5 Install .NET 8.0 SDK

- Download and install .NET 8.0 SDK from:
  https://dotnet.microsoft.com/download/dotnet/8.0
- Follow the installation instructions for your operating system
- Verify installation by opening a terminal and running:
  ```bash
  dotnet --version
  ```
- Expected output should show version 8.0.x

#### 2.2.6 Install Node.js and npm

- Download and install Node.js version 20+ (which includes npm) from:
  https://nodejs.org/
- Select the LTS (Long Term Support) version
- Follow the installation wizard
- Verify installation by running:
  ```bash
  node --version
  npm --version
  ```

#### 2.2.7 Install Visual Studio Code (Optional but Recommended)

- Download and install Visual Studio Code from:
  https://code.visualstudio.com/download
- Install recommended extensions:
  - C# (for .NET development)
  - ESLint (for JavaScript/TypeScript linting)
  - Prettier (for code formatting)
  - PostgreSQL (for database management)

#### 2.2.8 Install ApiApplication (Backend) Project

1. **Navigate to the backend directory:**

   ```bash
   cd ApiApplication
   ```

2. **Restore .NET packages:**

   ```bash
   dotnet restore
   ```

3. **Configure database connection:**

   - Open the file `appsettings.json` (or `appsettings.Development.json` for development)
   - Update the `ConnectionStrings` section with your PostgreSQL credentials:
     ```json
     {
       "ConnectionStrings": {
         "DbConnectionString": "Server=localhost;Port=5432;Database=BadmintonCourtManagementSystemDatabase;User Id=postgres;Password=YOUR_PASSWORD"
       }
     }
     ```
   - Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation

4. **Run database migrations:**

   ```bash
   dotnet ef database update
   ```

   - Note: If you encounter an error about `dotnet ef`, install the Entity Framework Core tools:
     ```bash
     dotnet tool install --global dotnet-ef
     ```

5. **Run the backend project:**
   ```bash
   dotnet run
   ```
   - The API will be available at:
     - HTTPS: `https://localhost:7000`
     - HTTP: `http://localhost:5000`
   - API documentation (Swagger) will be available at:
     - `https://localhost:7000/swagger`
     - `https://localhost:7000/scalar/v1`

**Figure 2.1: Database Configuration in appsettings.json**

```json
{
  "ConnectionStrings": {
    "DbConnectionString": "Server=localhost;Port=5432;Database=BadmintonCourtManagementSystemDatabase;User Id=postgres;Password=postgres"
  }
}
```

**Figure 2.2: Running Backend Project**

```bash
cd ApiApplication
dotnet restore
dotnet ef database update
dotnet run
```

#### 2.2.9 Install Web Application (Frontend) Project

1. **Navigate to the frontend directory:**

   ```bash
   cd web-application
   ```

2. **Install Node.js dependencies:**

   ```bash
   npm install
   ```

   - This may take several minutes as it downloads all required packages

3. **Configure environment variables (if needed):**

   - Create a `.env.local` file in the `web-application` directory
   - Add the following variables:
     ```
     NEXT_PUBLIC_API_URL=http://localhost:5000
     NEXT_PUBLIC_SIGNALR_URL=http://localhost:5000/hubs/booking
     ```

4. **Generate API types (optional but recommended):**

   ```bash
   npm run gen-types
   ```

   - This generates TypeScript types from the OpenAPI specification

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   - The web application will be available at:
     - `http://localhost:3000`

**Figure 2.3: Running Frontend Project**

```bash
cd web-application
npm install
npm run gen-types
npm run dev
```

#### 2.2.10 Install Mobile Application (Optional)

1. **Navigate to the mobile application directory:**

   ```bash
   cd mobile-app
   ```

2. **Install Node.js dependencies:**

   ```bash
   npm install
   ```

3. **Install Expo CLI globally (if not already installed):**

   ```bash
   npm install -g expo-cli
   ```

4. **Start the Expo development server:**
   ```bash
   npm start
   ```
   - This will open Expo DevTools in your browser
   - Scan the QR code with the Expo Go app on your mobile device
   - Or press `a` for Android emulator, `i` for iOS simulator

**Note:** For iOS development, you need macOS and Xcode installed.

#### 2.2.11 Install Face Liveness Service (Python Service)

1. **Install Python 3.10+** (if not already installed):

   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. **Navigate to the face liveness service directory:**

   ```bash
   cd face_liveness_service
   ```

3. **Create a virtual environment (recommended):**

   ```bash
   python -m venv venv
   ```

4. **Activate the virtual environment:**

   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

5. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

   - **Note:** This may take a long time as it installs TensorFlow and other ML libraries
   - Ensure you have sufficient disk space (several GB may be required)

6. **Run the Flask service:**
   ```bash
   python app.py
   ```
   - The service will be available at:
     - `http://localhost:5000` (or the port specified in `app.py`)

**Figure 2.4: Running Face Liveness Service**

```bash
cd face_liveness_service
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

#### 2.2.12 Install Face Recognition Application (WPF - Windows Only)

**Note:** This application requires Windows and .NET 8.0 Windows Runtime.

1. **Ensure .NET 8.0 SDK is installed** (see section 2.2.5)

2. **Navigate to the Face Recognition directory:**

   ```bash
   cd FaceRecognation
   ```

3. **Restore .NET packages:**

   ```bash
   dotnet restore
   ```

4. **Configure appsettings.json:**

   - Open `appsettings.json`
   - Update the CompreFace API endpoint and other configuration as needed

5. **Build the application:**

   ```bash
   dotnet build
   ```

6. **Run the application:**
   ```bash
   dotnet run
   ```
   - Or open the project in Visual Studio and run it from there

**Note:** This application requires a webcam and may need CompreFace service running.

#### 2.2.13 Using Docker Compose (Alternative Installation)

If you prefer using Docker:

1. **Install Docker Desktop:**

   - Download from: https://www.docker.com/products/docker-desktop
   - Follow the installation instructions

2. **Navigate to the project root directory:**

   ```bash
   cd Badminton_Court_Management_System
   ```

3. **Create a `.env` file** (if not exists) with PostgreSQL credentials:

   ```
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=BadmintonCourtManagementSystemDatabase
   ```

4. **Start PostgreSQL using Docker Compose:**

   ```bash
   docker-compose up -d postgres
   ```

5. **Verify the container is running:**

   ```bash
   docker ps
   ```

6. **Connect to the database:**
   - Use the connection string:
     ```
     Server=localhost;Port=5432;Database=BadmintonCourtManagementSystemDatabase;User Id=postgres;Password=postgres
     ```

### 2.3 Verification Steps

After installation, verify that all components are working:

1. **Backend API:**

   - Open browser and navigate to: `https://localhost:7000/swagger`
   - You should see the Swagger API documentation

2. **Frontend Web Application:**

   - Open browser and navigate to: `http://localhost:3000`
   - You should see the login page or home page

3. **Database Connection:**

   - Verify database connection by checking if migrations were applied successfully
   - Use pgAdmin to connect to the database and verify tables exist

4. **Mobile Application (if installed):**
   - Scan QR code with Expo Go app
   - Application should load on your device

### 2.4 Troubleshooting

#### Common Issues:

1. **Port Already in Use:**

   - If port 5000, 7000, or 3000 is already in use, stop the application using that port or change the port in configuration files

2. **Database Connection Failed:**

   - Verify PostgreSQL is running: `pg_isready` or check services
   - Verify connection string in `appsettings.json`
   - Check firewall settings

3. **npm install fails:**

   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` folder and `package-lock.json`
   - Run `npm install` again

4. **.NET restore fails:**

   - Clear NuGet cache: `dotnet nuget locals all --clear`
   - Run `dotnet restore` again

5. **Python dependencies fail to install:**

   - Ensure Python 3.10+ is installed
   - Use virtual environment
   - On Windows, you may need to install Visual C++ Build Tools

6. **Git clone fails:**
   - Verify you have access to the repository
   - Check your Git credentials
   - Ensure you have internet connection

### 2.5 Development Workflow

1. **Pull latest changes:**

   ```bash
   git pull origin main
   ```

2. **Create a new branch for your work:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes and commit:**

   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

4. **Push to remote repository:**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on the Git hosting platform (GitHub, GitLab, etc.)

### 2.6 Additional Resources

- **.NET Documentation:** https://docs.microsoft.com/dotnet/
- **Next.js Documentation:** https://nextjs.org/docs
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **React Documentation:** https://react.dev/
- **Expo Documentation:** https://docs.expo.dev/
- **Python Documentation:** https://docs.python.org/3/

---

**Note:** This installation guide assumes a development environment setup. For production deployment, additional configuration and security measures are required.
