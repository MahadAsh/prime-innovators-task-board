# PrimeInnovators Kanban Board

A pure frontend implementation of a collaborative Kanban-style task board, emphasizing strict architectural patterns, excellent DX, and performant state management.

## 🏗️ Architecture Decisions

### 1. State Management Approach

**Primary Architecture: State-Split Strategy**
We drew a strict line between **Server State** and **Client State**.

- **TanStack Query (react-query)** is used exclusively for Server State (Boards, Lists, Cards). The choice here is driven by its built-in caching, automatic loading/error handling primitives, and robust Optimistic UI capabilities crucial for a smooth drag-and-drop experience. Writing this in Redux would have required massive boilerplate for async thunks and manual race-condition handling.
- **Zustand** handles the thin layer of Client UI State (`theme`, `activeUserId`). It was chosen over Context API to prevent unnecessary app-wide re-renders when a small UI preference changes.

### 2. Component Architecture

The application uses a feature-based atomic structure. Primitive UI nodes (like Radix-powered `Dialog` components) live in `src/components/ui/`, while domain-specific complex models (`Board.tsx`, `KanbanCard.tsx`) remain adjacent to the main screen layout. This keeps imports shallow and highly readable.

### 3. API Integration & Mocking (MSW)

**Mock Service Worker (MSW)** was selected as the engine.

- **Why MSW vs. Mirage JS / JSON Server:** MSW intercepts requests directly at the network/Service Worker layer. This means our React components fire completely standard, unadulterated `fetch()` requests as if talking to a real cloud provider. Mirage often runs inside the app process, and JSON Server requires running a separate mock terminal. MSW provides the purest "Frontend-only" Developer Experience.
- **Persistence Across Sessions:** We enhanced the generic MSW setup to sync directly with the browser's `localStorage` upon every mutation. Thus, opening the app in a new tab naturally re-hydrates the application, satisfying the "shared link" multi-user requirement strictly on the frontend.
- **Realistic Network Environments:** Artificial latency (`500ms`) and explicit HTTP `404`/`201` status codes were coded directly into the handlers, allowing our TanStack Query hooks to legitimately test their `isLoading` and `isError` boundaries.

### 4. Simple Auth Simulation

To fulfill the simple authentication and multi-user illusion requirement, the application implements a purely frontend Auth layer:

- **Zero-Backend Login:** Upon first visit, users are greeted with a `LoginModal`. They are required to input a display name.
- **Local Storage Sessions:** This name is POSTed to our mocked MSW `/api/users` endpoint to register them in the mock database (generating a fake avatar based on their name). The system then stores their unique `usr-ID` in `localStorage` and binds it to the global Zustand `useAppStore`.
- This simple design means any card they create, comment they post, or card they assign themselves to correctly utilizes their chosen persona until they clear their browser cache.

### 5. Performance Strategy

- **Memoization (`React.memo`)**: Each Kanban card is deeply memoized. DND (Drag and Drop) libraries fire hundreds of reactive updates every second. `React.memo` guarantees we only re-render the two specific cards actively swapping places, leaving the hundreds of untouched list siblings alone.
- **Code-Splitting (`React.lazy`)**: The `CardModal` component (which is heavy with comments, users, tag computation, and native date pickers) is dynamically imported. Initial payload size is vastly reduced because the modal logic is not requested over the network until a user actively clicks a card for the very first time. `<Suspense>` handles the boundary perfectly.

### 6. Type Safety

We utilized unified, shared `interface` declarations in `src/types/index.ts`. Because MSW is written in TS inside the same codebase as the client React code, we achieve native end-to-end type safety. Changing a property name in the interface strictly binds both the fake MSW return JSON and the React props expecting it.

## 🚀 Running Locally

1. Install dependencies using Bun:
   ```bash
   bun install
   ```
2. Start the Vite dev server:
   ```bash
   bun run dev
   ```
   _Note: Because MSW handles the backend, no other terminal commands or backend servers need to be booted!_
