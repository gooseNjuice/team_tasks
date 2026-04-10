import { createListenerMiddleware, isRejected, type UnknownAction } from "@reduxjs/toolkit";
import { enqueueNotification } from "../features/notifications/notificationsSlice";
import { FILTERS_STORAGE_KEY } from "../features/ui/uiSlice";
import { api, type TasksQueryArgs } from "../services/api";
import type { RootState, AppDispatch } from "./store";

export const listenerMiddleware = createListenerMiddleware();

const startAppListening = listenerMiddleware.startListening.withTypes<RootState, AppDispatch>();

function getTasksArgsFromState(state: RootState): TasksQueryArgs {
    return {
        teamId: state.ui.teamId,
        status: state.ui.filters.status === "all" ? undefined : state.ui.filters.status,
        q: state.ui.filters.q || undefined,
        page: state.ui.filters.page,
        sort: state.ui.filters.sort,
    };
}

function getErrorMessage(action: { payload?: unknown; error?: { message?: string }; meta?: { arg?: { endpointName?: string } } }) {
    const endpointName = action.meta?.arg?.endpointName ?? "запрос";

    if (typeof action.payload === "object" && action.payload !== null) {
        const payload = action.payload as { status?: number; data?: { message?: string } };
        const status = payload.status ? `${payload.status}` : "unknown";
        const message = payload.data?.message ?? action.error?.message ?? "unknown error";
        return `Не удалось выполнить ${endpointName}: ${status} ${message}`;
    }

    return `Не удалось выполнить ${endpointName}: ${action.error?.message ?? "unknown error"}`;
}

startAppListening({
    predicate: (_action, currentState, previousState) => currentState.ui.filters !== previousState.ui.filters,
    effect: async (_action, listenerApi) => {
        listenerApi.cancelActiveListeners();
        await listenerApi.delay(400);

        const state = listenerApi.getState();
        const filters = state.ui.filters;

        window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
        listenerApi.dispatch(api.util.prefetch("getTasks", getTasksArgsFromState(state), { force: false }));
    },
});

startAppListening({
    matcher: (action: UnknownAction): action is UnknownAction => {
        return isRejected(action) && action.type.startsWith(`${api.reducerPath}/`);
    },
    effect: async (action, listenerApi) => {
        listenerApi.dispatch(
            enqueueNotification(
                getErrorMessage(action as { payload?: unknown; error?: { message?: string }; meta?: { arg?: { endpointName?: string } } }),
            ),
        );
    },
});
