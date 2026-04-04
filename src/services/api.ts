import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
    id: string;
    teamId: string;
    title: string;
    status: TaskStatus;
    likes: number;
    likedByMe: boolean;
};

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({ baseUrl: "/api" }), // позже подключим MSW или реальный бэк
    endpoints: (build) => ({
        getTasks: build.query<Task[], { teamId: string; status?: TaskStatus; q?: string; page?: number }>({
            query: ({ teamId, status, q, page }) => {
                const params = new URLSearchParams();
                if (status) params.set("status", status);
                if (q) params.set("q", q);
                if (page) params.set("page", String(page));
                const qs = params.toString();
                return `teams/${teamId}/tasks${qs ? `?${qs}` : ""}`;
            },
        }),
    }),
});

export const getTask: build.query<Task, {taskId: string}> = () => {

}

export const { useGetTasksQuery } = api;