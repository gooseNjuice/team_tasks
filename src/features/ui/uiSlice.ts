import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TaskSort, TaskStatus } from "../../services/api";

export type FilterStatus = TaskStatus | "all";
export type ActiveView = "list" | "kanban";

export type TaskFilters = {
    status: FilterStatus;
    q: string;
    sort: TaskSort;
    page: number;
};

export type UiState = {
    teamId: string;
    activeView: ActiveView;
    selectedTaskId: string | null;
    filters: TaskFilters;
    isCreateFormOpen: boolean;
};

const FILTERS_STORAGE_KEY = "team_tasks_filters";

function loadStoredFilters(): TaskFilters {
    if (typeof window === "undefined") {
        return {
            status: "all",
            q: "",
            sort: "updated_desc",
            page: 1,
        };
    }

    const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);

    if (!raw) {
        return {
            status: "all",
            q: "",
            sort: "updated_desc",
            page: 1,
        };
    }

    try {
        const parsed = JSON.parse(raw) as Partial<TaskFilters>;

        return {
            status: parsed.status ?? "all",
            q: parsed.q ?? "",
            sort: parsed.sort ?? "updated_desc",
            page: parsed.page ?? 1,
        };
    } catch {
        return {
            status: "all",
            q: "",
            sort: "updated_desc",
            page: 1,
        };
    }
}

const initialState: UiState = {
    teamId: "t1",
    activeView: "list",
    selectedTaskId: null,
    filters: loadStoredFilters(),
    isCreateFormOpen: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setStatusFilter: (state, action: PayloadAction<FilterStatus>) => {
            state.filters.status = action.payload;
            state.filters.page = 1;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.filters.q = action.payload;
            state.filters.page = 1;
        },
        setSort: (state, action: PayloadAction<TaskSort>) => {
            state.filters.sort = action.payload;
            state.filters.page = 1;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.filters.page = action.payload;
        },
        setSelectedTaskId: (state, action: PayloadAction<string | null>) => {
            state.selectedTaskId = action.payload;
        },
        setActiveView: (state, action: PayloadAction<ActiveView>) => {
            state.activeView = action.payload;
        },
        setCreateFormOpen: (state, action: PayloadAction<boolean>) => {
            state.isCreateFormOpen = action.payload;
        },
    },
});

export const {
    setActiveView,
    setCreateFormOpen,
    setPage,
    setSearchQuery,
    setSelectedTaskId,
    setSort,
    setStatusFilter,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export { FILTERS_STORAGE_KEY };
