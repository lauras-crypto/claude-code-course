# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run setup` — Install deps, generate Prisma client, run migrations
- `npm run dev` — Start dev server on localhost:3000 (uses Turbopack)
- `npm run build` — Production build
- `npm run test` — Run all tests with Vitest
- `npx vitest run src/path/to/test.test.tsx` — Run a single test file
- `npm run lint` — ESLint
- `npm run db:reset` — Reset database
- `npx prisma generate` — Regenerate Prisma client after schema changes
- `npx prisma migrate dev` — Create/apply migrations after schema changes

## Architecture

### Routes

- `/` — Home page: checks auth, redirects to first project or creates one
- `/[projectId]` — Project editor with chat + preview/code panels
- `/api/chat` — POST endpoint for AI streaming generation

### AI Generation Pipeline

User message → `/api/chat` route → `streamText()` with Claude (Haiku 4.5 via `@ai-sdk/anthropic`) → tool calls modify VirtualFileSystem → streamed back to client.

Two tools are available to the AI:
- **str_replace_editor** (`src/lib/tools/str-replace.ts`) — create, view, edit, insert, undo files
- **file_manager** (`src/lib/tools/file-manager.ts`) — rename, delete files

Without `ANTHROPIC_API_KEY`, a `MockLanguageModel` (`src/lib/provider.ts`) returns static component code for demo purposes.

The system prompt (`src/lib/prompts/generation.tsx`) enforces `/App.jsx` as the entry point and Tailwind for styling.

### Virtual File System

`VirtualFileSystem` class (`src/lib/file-system.ts`) is an in-memory file tree (Map-based). It serializes to/from JSON for database persistence. The `FileSystemProvider` context (`src/lib/contexts/file-system-context.tsx`) intercepts AI tool calls and syncs filesystem changes to React state.

### Live Preview

`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders a sandboxed iframe. The JSX transformer (`src/lib/transform/jsx-transformer.ts`) uses Babel standalone to transpile all files, creates blob URLs, and generates an HTML document with an import map pointing to esm.sh for React dependencies.

### Authentication

JWT-based sessions using `jose`, stored in HTTP-only cookies (`auth-token`). Auth logic in `src/lib/auth.ts`, server actions in `src/actions/index.ts`. Middleware (`src/middleware.ts`) protects API routes.

Anonymous users store work in sessionStorage (`src/lib/anon-work-tracker.ts`); on sign-in, work is migrated to a database project.

### Data Model

Only two Prisma models: `User` and `Project`. Messages and file data are stored as JSON strings on the Project model.

### State Management

React Context for shared state:
- `ChatProvider` — AI messages, input, streaming status
- `FileSystemProvider` — file tree, selected file, refresh trigger

### UI Layout

`MainContent` uses `react-resizable-panels`: left panel is Chat (35%), right panel toggles between Preview and Code view. Code view splits into FileTree (30%) + Monaco Editor (70%).

## Testing Patterns

Tests use Vitest + jsdom + React Testing Library. Mocks are set up with `vi.mock()` for contexts and child components. Tests live in `__tests__/` directories next to the components they test.

## Key Conventions

- Server components by default; `"use client"` only when needed
- UI components use shadcn/ui (new-york style) with `cn()` utility from `clsx` + `tailwind-merge`
- Path alias: `@/*` maps to `src/*`
- `src/generated/prisma/` is auto-generated — do not edit
