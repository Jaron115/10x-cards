# 10x Cards - AI-Powered Flashcard Application

A modern flashcard application built with Astro, React, and AI-powered generation capabilities.

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework
- [Supabase](https://supabase.com/) - Backend as a Service (Auth, Database, Storage)
- [Openrouter.ai](https://openrouter.ai/) - AI API for flashcard generation

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)
- Supabase CLI (for local development)
- Docker (for Supabase local instance)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd 10x-cards
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key

# Openrouter.ai (optional in development)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4
```

**Development Mode:** API keys for Openrouter are optional. The app uses mock data by default.

### 4. Set up Supabase local instance

```bash
# Start Supabase local instance
npx supabase start

# Apply migrations
npx supabase db reset
```

This will:
- Start local PostgreSQL database
- Apply all migrations from `supabase/migrations/`
- Create the necessary tables and indexes

### 5. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

### 6. Build for production

```bash
npm run build
```

## Available Scripts

### Application
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Supabase (requires Supabase CLI)
- `npx supabase start` - Start local Supabase instance
- `npx supabase stop` - Stop local Supabase instance
- `npx supabase db reset` - Reset database and apply migrations
- `npx supabase migration new <name>` - Create new migration

## Project Structure

```
.
├── src/
│   ├── layouts/           # Astro layouts
│   ├── pages/             # Astro pages
│   │   ├── api/           # API endpoints
│   │   │   └── generations.ts  # POST /api/generations
│   ├── components/        # UI components (Astro & React)
│   │   └── ui/            # Shadcn/ui components
│   ├── lib/               # Services and utilities
│   │   ├── services/      # Business logic services
│   │   │   ├── generation.service.ts
│   │   │   └── rateLimit.service.ts
│   │   ├── utils/         # Utility functions
│   │   └── validation/    # Zod schemas
│   ├── db/                # Database clients and types
│   │   ├── database.types.ts
│   │   └── supabase.client.ts
│   ├── middleware/        # Astro middleware
│   ├── types.ts           # Shared TypeScript types
│   └── assets/            # Static assets
├── supabase/
│   ├── config.toml        # Supabase configuration
│   └── migrations/        # Database migrations
├── public/                # Public assets
└── .ai/                   # AI documentation
    ├── prd.md
    ├── db-plan.md
    ├── api-plan.md
    └── api-endpoint-generations.md
```

## API Documentation

### Endpoints

#### POST /api/generations

Generate flashcard proposals from text using AI.

**Request:**
```json
{
  "source_text": "Your text here (1000-10000 characters)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generation_id": 1,
    "model": "openai/gpt-4 (mock)",
    "duration_ms": 2347,
    "generated_count": 5,
    "flashcards_proposals": [
      {
        "front": "Question",
        "back": "Answer",
        "source": "ai-full"
      }
    ]
  }
}
```

**Full documentation:** See `.ai/api-endpoint-generations.md`

### Rate Limiting

- **Development:** Disabled
- **Production:** 10 generations per user per day

### Authentication

- **Development:** Uses `DEFAULT_USER_ID` from database
- **Production:** Requires Supabase JWT token

## Database

### Schema

The application uses the following main tables:

- `flashcards` - User's flashcard collection
- `generations` - AI generation metadata
- `generation_error_logs` - AI API error tracking

### Migrations

All migrations are in `supabase/migrations/`. To apply:

```bash
npx supabase db reset
```

### Local Development

The app uses Supabase local instance with a test user:
- User ID: `c9bdbe74-1ccb-47fc-a3ae-b50b20163cdd`

## Development Configuration

### Mock Data

By default, the app uses mock AI responses. To enable real AI:

**File:** `src/pages/api/generations.ts`
```typescript
const DEV_CONFIG = {
  SKIP_RATE_LIMIT: false,  // Enable rate limiting
  USE_MOCK_AI: false,      // Use real AI API
}
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
