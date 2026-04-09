import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskSort = "updated_desc" | "likes_desc" | "title_asc";

export type Task = {
    id: string;
    teamId: string;
    title: string;
    description: string;
    status: TaskStatus;
    likes: number;
    likedByMe: boolean;
    updatedAt: string;
};

export type TasksQueryArgs = {
    teamId: string;
    status?: TaskStatus;
    q?: string;
    page?: number;
    sort?: TaskSort;
};

export type TasksResponse = {
    items: Task[];
    total: number;
    page: number;
    pageSize: number;
};

export type CreateTaskInput = {
    teamId: string;
    title: string;
    description: string;
    status: TaskStatus;
};

export type UpdateTaskInput = {
    taskId: string;
    changes: Partial<Pick<Task, "title" | "description" | "status">>;
};

export type ToggleLikeInput = {
    taskId: string;
};

type ApiQueryState = {
    queries?: Record<string, { endpointName?: string; originalArgs?: unknown }>;
};

const PAGE_SIZE = 10;

function sanitizeQueryArg(args: TasksQueryArgs): Required<TasksQueryArgs> {
    return {
        teamId: args.teamId,
        status: args.status ?? "todo",
        q: args.q ?? "",
        page: args.page ?? 1,
        sort: args.sort ?? "updated_desc",
    };
}

function getTeamListTag(teamId: string) {
    return `LIST-team-${teamId}`;
}

function getScopedListTag(args: TasksQueryArgs) {
    const normalized = sanitizeQueryArg(args);
    return `LIST-team-${normalized.teamId}-status-${normalized.status}-q-${normalized.q || "all"}-page-${normalized.page}-sort-${normalized.sort}`;
}

function getCachedTaskListArgs(state: { [key: string]: ApiQueryState }, reducerPath: string): TasksQueryArgs[] {
    const queries = state[reducerPath]?.queries ?? {};

    return Object.values(queries)
        .filter((entry): entry is { endpointName: string; originalArgs: TasksQueryArgs } => {
            return entry.endpointName === "getTasks" && Boolean(entry.originalArgs);
        })
        .map((entry) => entry.originalArgs);
}

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
    tagTypes: ["Tasks", "Task"],
    refetchOnFocus: true,
    keepUnusedDataFor: 60,
    endpoints: (build) => ({
        getTasks: build.query<TasksResponse, TasksQueryArgs>({
            query: ({ teamId, status, q, page, sort }) => {
                const params = new URLSearchParams();
                if (status) params.set("status", status);
                if (q) params.set("q", q);
                if (page) params.set("page", String(page));
                if (sort) params.set("sort", sort);
                const qs = params.toString();
                return `teams/${teamId}/tasks${qs ? `?${qs}` : ""}`;
            },
            providesTags: (result, _error, arg) => {
                const tags: Array<{ type: "Tasks" | "Task"; id: string }> = [
                    { type: "Tasks", id: getTeamListTag(arg.teamId) },
                    { type: "Tasks", id: getScopedListTag(arg) },
                ];

                if (result) {
                    result.items.forEach((task) => tags.push({ type: "Task", id: task.id }));
                }

                return tags;
            },
        }),
        getTask: build.query<Task, { taskId: string }>({
            query: ({ taskId }) => `tasks/${taskId}`,
            providesTags: (_result, _error, arg) => [{ type: "Task", id: arg.taskId }],
        }),
        createTask: build.mutation<Task, CreateTaskInput>({
            query: (body) => ({
                url: `teams/${body.teamId}/tasks`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: "Tasks", id: getTeamListTag(arg.teamId) },
                { type: "Tasks", id: getScopedListTag({ teamId: arg.teamId, status: arg.status, page: 1 }) },
            ],
        }),
        updateTask: build.mutation<Task, UpdateTaskInput>({
            query: ({ taskId, changes }) => ({
                url: `tasks/${taskId}`,
                method: "PATCH",
                body: changes,
            }),
            invalidatesTags: (result, _error, arg) => [
                { type: "Task", id: arg.taskId },
                { type: "Tasks", id: getTeamListTag(result?.teamId ?? "unknown") },
            ],
        }),
        toggleLike: build.mutation<Task, ToggleLikeInput>({
            query: ({ taskId }) => ({
                url: `tasks/${taskId}/toggle-like`,
                method: "POST",
            }),
            async onQueryStarted({ taskId }, { dispatch, getState, queryFulfilled }) {
                const state = getState() as { [key: string]: ApiQueryState };
                const patches = getCachedTaskListArgs(state, api.reducerPath).map((args) =>
                    dispatch(
                        api.util.updateQueryData("getTasks", args, (draft) => {
                            const task = draft.items.find((item) => item.id === taskId);

                            if (!task) return;

                            task.likedByMe = !task.likedByMe;
                            task.likes += task.likedByMe ? 1 : -1;
                        }),
                    ),
                );

                const detailsPatch = dispatch(
                    api.util.updateQueryData("getTask", { taskId }, (draft) => {
                        draft.likedByMe = !draft.likedByMe;
                        draft.likes += draft.likedByMe ? 1 : -1;
                    }),
                );

                try {
                    const { data } = await queryFulfilled;

                    dispatch(
                        api.util.updateQueryData("getTask", { taskId }, (draft) => {
                            Object.assign(draft, data);
                        }),
                    );

                    getCachedTaskListArgs(getState() as { [key: string]: ApiQueryState }, api.reducerPath).forEach((args) => {
                        dispatch(
                            api.util.updateQueryData("getTasks", args, (draft) => {
                                const task = draft.items.find((item) => item.id === taskId);
                                if (task) {
                                    Object.assign(task, data);
                                }
                            }),
                        );
                    });
                } catch {
                    detailsPatch.undo();
                    patches.forEach((patch) => patch.undo());
                }
            },
        }),
    }),
});

export const {
    useCreateTaskMutation,
    useGetTaskQuery,
    useGetTasksQuery,
    useToggleLikeMutation,
    useUpdateTaskMutation,
} = api;

export { PAGE_SIZE, getScopedListTag, getTeamListTag };
