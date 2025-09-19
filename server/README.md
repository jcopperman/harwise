# Harwise Server

Backend API server for the Harwise UI application.

## Features

- 🚀 **RESTful API** - Express.js server with TypeScript
- 📁 **File Upload** - Secure HAR file upload with validation
- ⚙️ **CLI Integration** - Wraps all Harwise CLI commands
- 🔒 **Security** - Helmet, CORS, and file validation
- 📊 **Processing** - All CLI features available via API

## API Endpoints

### Health Check
```
GET /api/health
```

### File Upload
```
POST /api/upload
Content-Type: multipart/form-data
Body: harFile (file)
```

### Statistics
```
POST /api/stats
Content-Type: multipart/form-data
Body: harFile (file)
```

### Compare Files
```
POST /api/compare
Content-Type: multipart/form-data
Body: harFile1 (file), harFile2 (file)
```

### Generate Content
```
POST /api/generate/:type
Content-Type: multipart/form-data
Body: harFile (file)

Types: tests, insomnia, curl
```

### Run Tests
```
POST /api/test
Content-Type: multipart/form-data
Body: harFile (file)
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Configuration

Copy `.env.example` to `.env` and adjust settings:

```bash
cp .env.example .env
```

## Security Features

- File type validation (HAR files only)
- File size limits (50MB)
- CORS protection
- Security headers with Helmet
- Temporary file cleanup

## Integration

The server expects the Harwise CLI to be built and available at `../dist/index.js` relative to the server directory.