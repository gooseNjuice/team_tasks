import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

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
    baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
    endpoints: (build) => {
        getTasks: build.query<Task[]>
    }
})