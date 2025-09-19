# Harwise Frontend

A modern React web interface for the Harwise CLI tool.

## Features

- 🎯 **Dashboard** - Overview and quick actions
- 🔍 **Compare** - Compare two HAR files for differences
- ⚙️ **Generate** - Create tests, Insomnia collections, and curl suites
- 📊 **Stats** - Analyze HAR file statistics
- 🧪 **Test** - Run generated test suites

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for server state management
- **React Dropzone** for file uploads
- **Lucide React** for icons

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   └── Layout.tsx  # Main layout with navigation
├── pages/          # Page components
│   ├── Dashboard.tsx
│   ├── Compare.tsx
│   ├── Generate.tsx
│   ├── Stats.tsx
│   └── Test.tsx
├── App.tsx         # Main app component with routing
├── main.tsx        # Entry point
└── index.css       # Global styles
```

## API Integration

The frontend communicates with a backend server (port 3001) that wraps the Harwise CLI functionality. API calls are proxied through Vite's dev server.

## Next Steps

1. Install dependencies and run the development server
2. Implement backend API server
3. Add file upload functionality
4. Build individual feature components
5. Add real-time progress tracking
6. Implement results visualization