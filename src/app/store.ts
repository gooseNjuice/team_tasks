    import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { listenerMiddleware } from "./listenerMiddleware";
import { notificationsReducer } from "../features/notifications/notificationsSlice";
import { tasksReducer } from "../features/tasks/tasksSlice";
import { uiReducer } from "../features/ui/uiSlice";
import { api } from "../services/api";

export const store = configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
        notifications: notificationsReducer,
        tasks: tasksReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: true,
        })
            .prepend(listenerMiddleware.middleware)
            .concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
