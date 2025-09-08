# ReqGenAI Frontend

A modern React frontend for the ReqGenAI intelligent requirement generation system.

## Features

- **Dashboard**: View and manage all requirements with filtering and search
- **Create Requirements**: Multiple input types (manual, transcript, file)
- **Requirement Details**: Comprehensive view with document management
- **Real-time Processing**: Live status updates and progress tracking
- **Document Versioning**: Track all generated documents and versions
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **React 19** - Modern React with hooks
- **Chakra UI** - Beautiful, accessible component library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **Context API** - State management

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on port 3000

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure API settings:

   - Create a `.env` file in the frontend directory
   - Set `REACT_APP_API_URL` to your backend API URL
   - Set `REACT_APP_API_KEY` to your API key

3. Start the development server:

```bash
npm start
```

The app will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.js       # Main layout wrapper
│   ├── ErrorBoundary.js # Error handling
│   └── LoadingSpinner.js # Loading states
├── pages/              # Page components
│   ├── Dashboard.js    # Main dashboard
│   ├── CreateRequirement.js # Requirement creation
│   └── RequirementDetail.js # Requirement details
├── context/            # React Context
│   └── RequirementContext.js # Global state
├── services/           # API services
│   └── api.js         # API client
├── utils/              # Utility functions
│   └── helpers.js     # Common helpers
├── config/             # Configuration
│   └── api.js         # API configuration
├── App.js             # Main app component
├── index.js           # App entry point
└── theme.js           # Chakra UI theme
```

## API Integration

The frontend integrates with the following backend endpoints:

- `GET /api/projects` - List all requirements
- `GET /api/projects/:reqId` - Get requirement details
- `POST /api/inputs/manual` - Create manual requirement
- `POST /api/inputs/transcript` - Create from transcript
- `POST /api/inputs/file` - Create from file
- `POST /api/actions/extract/:reqId` - Extract requirements
- `POST /api/actions/brd/:reqId` - Generate BRD
- `POST /api/actions/blueprint/:reqId` - Generate blueprint
- `POST /api/actions/bitrix24/create-project/:reqId` - Create Bitrix24 project

## Key Features

### Dashboard

- Statistics cards showing requirement counts by status
- Search and filter functionality
- Pagination for large datasets
- Real-time status updates

### Requirement Creation

- Multiple input types (manual, transcript, file)
- Form validation and error handling
- Tips and guidance for better results
- Automatic requirement extraction

### Requirement Details

- Tabbed interface (Overview, Documents, Actions)
- Document versioning and management
- Action buttons for processing steps
- Modal views for document content

## Styling

The app uses Chakra UI with a custom theme:

- Brand colors (blue palette)
- Consistent spacing and typography
- Responsive design patterns
- Dark/light mode support

## Error Handling

- Global error boundary for unexpected errors
- API error handling with user-friendly messages
- Loading states for better UX
- Retry mechanisms for failed requests

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- ESLint configuration for code quality
- Prettier for code formatting
- Consistent naming conventions
- Component-based architecture

## Deployment

The frontend can be deployed to any static hosting service:

1. Build the production bundle: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure environment variables for production API URL

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure responsive design works on all devices

## License

MIT License - see LICENSE file for details
