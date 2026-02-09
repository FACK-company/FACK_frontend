# FACK Frontend - Professional Next.js Application

A production-ready Next.js 15 frontend with TypeScript, Tailwind CSS, and dual backend service integration.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

✅ **Next.js 15 App Router** - Modern React framework  
✅ **TypeScript** - Full type safety  
✅ **Tailwind CSS** - Responsive styling  
✅ **Component Architecture** - UI and feature components separated  
✅ **Dual API Integration** - Spring Boot + Node.js backends  
✅ **Custom Hooks** - `useMediaRecorder` for audio recording  
✅ **Docker Ready** - Production-optimized Dockerfile  
✅ **Security Headers** - Built-in security features  

## Project Structure

```
src/
├── app/              # Next.js pages and layout
├── components/
│   ├── ui/          # Reusable base components
│   └── features/    # Complex components (Recording, etc)
├── services/        # API clients (Main & Recording)
├── hooks/           # Custom React hooks
├── types/           # TypeScript definitions
├── utils/           # Helper functions
└── styles/          # CSS and Tailwind config
```

## Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your backend URLs:
```env
NEXT_PUBLIC_MAIN_API_URL=http://localhost:8080
NEXT_PUBLIC_RECORDING_API_URL=http://localhost:3001
```

## Running the App

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**Type Check:**
```bash
npm run type-check
```

**Lint:**
```bash
npm run lint
```

## Docker

**Build:**
```bash
docker build -t fack-frontend:latest .
```

**Run:**
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_MAIN_API_URL=http://localhost:8080 \
  -e NEXT_PUBLIC_RECORDING_API_URL=http://localhost:3001 \
  fack-frontend:latest
```

## API Services

### Main API (Spring Boot)
```typescript
import { mainApi } from '@/services'

await mainApi.getItems()
await mainApi.getItemById(id)
await mainApi.createItem(data)
await mainApi.updateItem(id, data)
await mainApi.deleteItem(id)
```

### Recording API (Node.js)
```typescript
import { recordingApi } from '@/services'

await recordingApi.uploadRecording(audioBlob)
await recordingApi.getRecordings()
await recordingApi.getRecordingById(id)
await recordingApi.processRecording(id, type)
await recordingApi.deleteRecording(id)
```

## Media Recorder Hook

```typescript
import { useMediaRecorder } from '@/hooks/useMediaRecorder'

const {
  isRecording,
  isPaused,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
} = useMediaRecorder()
```

## Documentation

See [DETAILED_README.md](./DETAILED_README.md) for comprehensive documentation.

## Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Runtime:** Node.js 20+
- **Container:** Docker

## Key Configuration Files

- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript settings with path aliases
- `tailwind.config.ts` - Tailwind customization
- `Dockerfile` - Multi-stage production build

## Security

- ✅ TypeScript strict mode
- ✅ Content Security Policy headers
- ✅ X-Frame-Options protection
- ✅ XSS protection headers
- ✅ Non-root Docker user
- ✅ Request/response interceptors for auth

## License

Proprietary and Confidential

---

**Built with Next.js, React, TypeScript, and Tailwind CSS**
