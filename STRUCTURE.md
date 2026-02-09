# Project Structure Documentation

## Directory Overview

```
src/
├── app/                          # Next.js App Router (pages & layouts)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (/)
│   ├── (dashboard)/              # Route group for protected routes
│   │   ├── layout.tsx            # Dashboard layout wrapper
│   │   └── page.tsx              # Dashboard home (/dashboard)
│   └── api/                      # API routes (optional)
│
├── components/                   # React components
│   ├── ui/                       # Reusable base components
│   │   ├── base/                 # Atomic components
│   │   │   └── Button.tsx        # Example: Button component
│   │   └── index.ts              # UI components barrel export
│   │
│   └── features/                 # Complex feature components
│       ├── recording/            # Recording feature
│       │   └── RecordingController.tsx
│       ├── playback/             # Playback feature
│       │   └── AudioPlayer.tsx
│       └── index.ts              # Features barrel export
│
├── services/                     # API clients & business logic
│   ├── mainApi/                  # Spring Boot API client
│   │   ├── client.ts             # API request methods
│   │   └── index.ts              # Exports
│   ├── recordingApi/             # Node.js Recording API client
│   │   ├── client.ts             # API request methods
│   │   └── index.ts              # Exports
│   └── index.ts                  # Services barrel export
│
├── hooks/                        # Custom React hooks
│   ├── useMediaRecorder.ts       # Media recording hook
│   └── index.ts                  # Hooks barrel export
│
├── types/                        # TypeScript type definitions
│   ├── api/                      # API-related types
│   │   ├── main.ts               # Main API types
│   │   └── recording.ts          # Recording API types
│   └── index.ts                  # Global types
│
├── utils/                        # Utility functions
│   ├── http/                     # HTTP utilities
│   │   ├── httpClient.ts         # Reusable HTTP client
│   │   └── index.ts              # Exports
│   ├── validation/               # Validation functions
│   │   └── index.ts              # Validation utilities
│   └── constants.ts              # App constants (optional)
│
└── styles/                       # CSS & styling
    ├── globals/                  # Global styles
    │   ├── globals.css           # Main global styles
    │   └── variables.css         # CSS variables & design tokens
    └── modules/                  # CSS modules (optional)

```

## Root Configuration Files

```
├── Dockerfile                    # Production Docker image
├── .dockerignore                 # Files to exclude from Docker
├── .env.local.example            # Environment variables template
├── next.config.js                # Next.js configuration
├── tailwind.config.js/.ts        # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

## Key Features

### 1. **App Router Structure** (`src/app/`)
- Modern Next.js App Router layout
- Route groups with `(dashboard)` for organized navigation
- Separate layouts for different page sections
- API routes ready for middleware or serverless functions

### 2. **Dual Backend Services**
- **mainApi**: Spring Boot backend (Java)
  - `src/services/mainApi/client.ts` - API methods
  - `src/types/api/main.ts` - Type definitions
  
- **recordingApi**: Node.js backend
  - `src/services/recordingApi/client.ts` - API methods
  - `src/types/api/recording.ts` - Type definitions

### 3. **Component Organization**
- **UI Components** (`ui/base/`): Reusable, stateless components
  - Button, Input, Card, Modal, etc.
  - Pure presentation layer
  
- **Feature Components** (`features/`): Complex, stateful components
  - Recording controller with hooks
  - Playback player with controls
  - Business logic integration

### 4. **Custom Hooks** (`src/hooks/`)
- `useMediaRecorder`: Handles audio/video recording logic
- Encapsulates complex state and effects
- Reusable across components

### 5. **Styling**
- **Tailwind CSS** for utility-first styling
- Global styles in `src/styles/globals/`
- CSS variables for design tokens
- Component-scoped styles (optional CSS modules)

### 6. **HTTP Client**
- Centralized API request handler (`src/utils/http/httpClient.ts`)
- Environment-based URLs from `.env.local`
- Error handling and timeout management
- Request/response interceptors ready

### 7. **Docker Production Build**
- Multi-stage build for optimized image size
- Alpine Linux base for minimal footprint
- Non-root user for security
- Standalone output mode for lightweight deployment

## Environment Variables

Create `.env.local` from `.env.local.example`:

```env
NEXT_PUBLIC_MAIN_API_URL=http://localhost:8080
NEXT_PUBLIC_RECORDING_API_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=30000
```

## Development Workflow

### Starting Development
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

### Docker Deployment
```bash
docker build -t fack-frontend .
docker run -p 3000:3000 fack-frontend
```

## Import Aliases

TypeScript is configured with path aliases for cleaner imports:

```typescript
// Instead of: import Button from '../../../components/ui/base/Button'
import { Button } from '@/components/ui';

// Services
import { mainApi } from '@/services/mainApi';

// Types
import type { MainApiResponse } from '@/types/api/main';

// Utils
import { httpClient } from '@/utils/http';
```

## Best Practices

1. **Keep UI components pure** - No business logic in `ui/` components
2. **Centralize API calls** - Use services for all backend communication
3. **Type everything** - Leverage TypeScript for safety
4. **Use custom hooks** - Extract complex logic into reusable hooks
5. **Environment-based URLs** - Never hardcode API endpoints
6. **CSS in components** - Use Tailwind classes or CSS modules, not inline styles
7. **Barrel exports** - Use `index.ts` for cleaner imports

## Next Steps

1. Install dependencies: `npm install`
2. Configure environment variables in `.env.local`
3. Implement API clients in `services/`
4. Build UI components in `components/ui/base/`
5. Create feature components in `components/features/`
6. Add custom hooks in `hooks/`
7. Build pages in `app/`

---

This structure is designed to scale with your application while maintaining clean code organization and separation of concerns.
