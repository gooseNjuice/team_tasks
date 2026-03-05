# Team Tasks — Redux Toolkit + RTK Query Practice Project

A small “almost-production” task tracker designed to drill **modern Redux Toolkit patterns**: RTK Query caching & invalidation, optimistic updates, entity adapters, memoized selectors, and listener middleware side-effects.

## Features

* **Tasks by team** with filters (status, search query) and basic pagination
* **Task details** view
* **Like / reaction toggle** with **optimistic UI** (rollback on error)
* **Kanban-style** status changes (todo / in_progress / done)
* **Smart caching** via RTK Query:

    * per-entity tags
    * list tags
    * background refetching (focus / polling configurable)
* **Normalized local state** using `createEntityAdapter`
* **Memoized selectors** using `createSelector`
* **Side-effects** via `listenerMiddleware`:

    * debounced filter persistence + optional prefetch
    * global API error toasts/notifications
* **Serializable state discipline** (RTK `serializableCheck` stays enabled)

## Tech Stack

* React
* TypeScript
* Redux Toolkit (RTK)
* RTK Query
* (Optional) MSW (Mock Service Worker) for API mocking

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run the app

```bash
npm run dev
```

### 3) Run tests (if present)

```bash
npm test
```

## Project Structure (suggested)

```
src/
  app/
    store.ts
    hooks.ts
  services/
    api.ts                # RTK Query createApi + endpoints
  features/
    tasks/
      tasksSlice.ts       # createEntityAdapter + matchers
      selectors.ts        # createSelector memoized selectors
      components/
        TaskListPage.tsx
        TaskDetails.tsx
        KanbanBoard.tsx
    ui/
      uiSlice.ts          # filters (status/q/page)
    notifications/
      notificationsSlice.ts
  middleware/
    listeners.ts          # listenerMiddleware setup
```

## Core Requirements / What to Implement

### Store Setup

* Configure the store with:

    * `api.reducer` under `api.reducerPath`
    * `api.middleware`
    * `tasksSlice`
    * `listenerMiddleware.middleware`
* Keep `serializableCheck` enabled (adjust ignored actions/paths only if necessary).

### RTK Query Endpoints

#### `getTasks`

* `query({ teamId, status, q, page })`
* `providesTags`:

    * one **LIST** tag per list query (include team/status/q/page in the id)
    * a **Task** tag for each returned task

#### `getTask`

* `query({ taskId })`
* `providesTags: [{ type: 'Task', id: taskId }]`

#### `createTask`

* `invalidatesTags`: relevant list tags (at least the team list)

#### `updateTask`

* `invalidatesTags`: `{ type: 'Task', id }` + relevant list tags

#### `toggleLike`

* Must be **optimistic** via `onQueryStarted`:

    * update `getTask` cache
    * update all relevant `getTasks` caches
    * rollback on error

### Normalization (Entity Adapter)

* Use `createEntityAdapter` in `tasksSlice`.
* When `getTasks` succeeds:

    * `upsertMany` into adapter state.
* Provide selectors:

    * `selectTaskById`
    * `selectTasksByTeam`
    * `selectTasksByTeamAndStatus`
* Add memoized derived selectors via `createSelector` (examples):

    * top tasks by likes per team
    * counts per status

### Listener Middleware

Implement at least two listeners:

1. **Debounced filter persistence**

* When filters change (status / q / sort / page):

    * debounce ~400ms
    * persist to `localStorage`
    * optionally `api.util.prefetch('getTasks', args, { force: false })`

2. **Global API error notifications**

* Catch rejected RTK Query actions and push a user-facing message into `notificationsSlice`.

## UI Pages

### `TaskListPage(teamId)`

* filters (status + search q)
* list view
* show `isLoading` vs `isFetching`
* create button

### `TaskDetails(taskId)`

* powered by `useGetTaskQuery`
* like button with optimistic update feel

### `KanbanBoard(teamId)`

* 3 columns
* move tasks between statuses via `updateTask`
* drag & drop optional (buttons are fine)

## Acceptance Checklist

* [ ] Like toggle updates UI instantly and rolls back on error
* [ ] `updateTask` updates both details and list views without manual refetching
* [ ] Selectors are memoized (no needless recomputation)
* [ ] Listener middleware is debounced (no localStorage spam)
* [ ] Cache invalidation is precise (no “refetch everything” behavior)

## Notes & Tips

* Prefer RTK Query for async data (avoid writing custom thunks here).
* Use `selectFromResult` in RTK Query hooks if you want to reduce re-renders.
* Keep list tag IDs deterministic so invalidation hits the right caches.

## License
...