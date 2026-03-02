# PrimeInnovators Kanban Board (Frontend Architecture Project)

This project is a deeply architected, pure frontend implementation of a collaborative Kanban board designed to test React structuring, state management, and modern tooling over a one-month deadline. It explicitly does not use a real backend API, substituting all data fetching with a Mock Service Worker (MSW) layer to maintain strict separation of frontend concerns.

## 🛠 Technology Stack & Justifications

### 1. Build & Monorepo Tools
- **Bun**: Used as the primary package manager for extreme speed and the runtime script executor.
- **Turborepo**: Configured at the workspace root to orchestrate potential future packages (`packages/ui`, `packages/utils`). Currently runs the apps/web scaffolding.
- **Flox**: The `.flox` configurations are included in the repository root specifying exact `bun` and `node` versions to guarantee a reproducible developer environment upon clone (Assignment Rubric Met).

### 2. Frontend Framework & Styling
- **Vite + React + TypeScript**: A fast, strictly typed foundation.
- **Tailwind CSS**: Used exclusively for styling. We built custom Design Tokens in `import.meta.env.DEV` to handle theming (Dark/Light mode) efficiently using CSS variables injected into the Tailwind config.

### 3. State Management (The Two-Tier Approach)
This project strictly separates "Server State" from "Client UI State":

#### **Async / Server State: TanStack Query (React Query)**
- *Why?* Drag and Drop interactions require instant feedback. We use React Query to perform **Optimistic UI Updates**. When a card is dragged, we instantly update the Query Cache representation of the board *before* the mocked server responds. If the MSW mock throws an error, React Query seamlessly rolls back the UI state.
- *Bonus*: Handles loading states, caching, and request deduplication automatically.

#### **Global Client State: Zustand**
- *Why?* We needed a lightweight way to store the user's `theme` preference (Dark vs Light) and their simulated authentication session (e.g., currently logged in as "Mahad"). 
- *Why not Redux?* Redux provides too much boilerplate for simple UI toggles. Zustand allows us to create isolated hooks like `useAppStore()` without wrapping the entire app in massive Context providers.

### 4. API Mocking Layer
- **Mock Service Worker (MSW)** 
- *Why?* Unlike MirageJS which intercepts within the framework, or JSON Server which requires running a separate localhost port, MSW intercepts API requests at the **Service Worker** level.
- *Benefit*: This allows our React components to use native standard `fetch('/api/cards')` calls. From the React code's perspective, it is communicating with a real production backend. This provided the most realistic structural test compared to hardcoding JSON imports.

### 5. Drag and Drop Engine
- **@dnd-kit/core**: Chosen over `react-beautiful-dnd` because it is modern, actively maintained, lighter in bundle size, and highly accessible via keyboard navigation out of the box.

## ⚡ Performance Optimizations Implemented
- **React.memo**: The `KanbanCard` component is wrapped in `React.memo` to prevent the hundreds of generic cards on the board from re-rendering every time the parent `Board` alters its active drag layout constraints.
- **Optimistic UI**: No UI freezing waiting for API responses.

## 🚀 Running the Project

1. Run `bun install` to install dependencies.
2. Run `bun run dev` to start the Turborepo task orchestrator.
3. Open `localhost:5173`. MSW will log its activation in the browser console.
