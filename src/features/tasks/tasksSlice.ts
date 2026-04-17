import {
    createEntityAdapter,
    createSelector,
    createSlice,
    isAnyOf,
    type EntityState,
    type PayloadAction,
} from "@reduxjs/toolkit";
import { api, type Task, type TaskStatus } from "../../services/api";

export const tasksAdapter = createEntityAdapter<Task>({
    sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
});

const initialState = tasksAdapter.getInitialState({
    hydrationCount: 0,
});

const taskMutations = isAnyOf(
    api.endpoints.getTask.matchFulfilled,
    api.endpoints.createTask.matchFulfilled,
    api.endpoints.updateTask.matchFulfilled,
    api.endpoints.toggleLike.matchFulfilled,
);

const tasksSlice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        upsertTasksManually: (state, action: PayloadAction<Task[]>) => {
            tasksAdapter.upsertMany(state, action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(api.endpoints.getTasks.matchFulfilled, (state, action) => {
                tasksAdapter.upsertMany(state, action.payload.items);
                state.hydrationCount += 1;
            })
            .addMatcher(taskMutations, (state, action) => {
                tasksAdapter.upsertOne(state, action.payload);
                state.hydrationCount += 1;
            });
    },
});

const taskSelectors = tasksAdapter.getSelectors();

const selectTaskEntities = (state: { tasks: EntityState<Task, string> }) => taskSelectors.selectEntities(state.tasks);
const selectAllTasks = (state: { tasks: EntityState<Task, string> }) => taskSelectors.selectAll(state.tasks);

export const selectTaskById = createSelector(
    [selectTaskEntities, (_state: { tasks: EntityState<Task, string> }, taskId: string | null) => taskId],
    (entities, taskId) => (taskId ? entities[taskId] ?? null : null),
);

export const selectTasksByTeam = createSelector(
    [selectAllTasks, (_state: { tasks: EntityState<Task, string> }, teamId: string) => teamId],
    (tasks, teamId) => tasks.filter((task) => task.teamId === teamId),
);

export const selectTasksByTeamAndStatus = createSelector(
    [
        selectTasksByTeam,
        (_state: { tasks: EntityState<Task, string> }, _teamId: string, status: TaskStatus) => status,
    ],
    (tasks, status) => tasks.filter((task) => task.status === status),
);

export const selectTopTasksByLikes = createSelector(
    [selectTasksByTeam],
    (tasks) => [...tasks].sort((a, b) => b.likes - a.likes).slice(0, 5),
);

export const selectTaskCountsByStatus = createSelector([selectTasksByTeam], (tasks) => {
    return tasks.reduce<Record<TaskStatus, number>>(
        (counts, task) => {
            counts[task.status] += 1;
            return counts;
        },
        {
            todo: 0,
            in_progress: 0,
            done: 0,
        },
    );
});

export const { upsertTasksManually } = tasksSlice.actions;
export const tasksReducer = tasksSlice.reducer;
