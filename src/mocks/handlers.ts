import { http, HttpResponse } from "msw";
import type { Task, TaskStatus } from "../services/api";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

function makeTasks(teamId: string, count = 15): Task[] {
    return Array.from({ length: count }, (_, i) => {
        const id = `${teamId}-${i + 1}`;
        const status = STATUSES[i % STATUSES.length];
        return {
            id,
            teamId,
            title: `Task #${i + 1}`,
            status,
            likes: (i * 7) % 13,
            likedByMe: i % 4 === 0,
        };
    });
}

// In-memory DB per team (so edits could be added later)
const db = new Map<string, Task[]>();

function getDb(teamId: string) {
    if (!db.has(teamId)) db.set(teamId, makeTasks(teamId));
    return db.get(teamId)!;
}

export const handlers = [
    // GET /api/teams/:teamId/tasks?status=&q=&page=
    http.get("/api/teams/:teamId/tasks", ({ params, request }) => {
        const teamId = String(params.teamId);
        const url = new URL(request.url);

        const status = url.searchParams.get("status") as TaskStatus | null;
        const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
        const page = Number(url.searchParams.get("page") ?? "1");

        const pageSize = 10;
        const all = getDb(teamId);

        let filtered = all;
        if (status) filtered = filtered.filter((t) => t.status === status);
        if (q) filtered = filtered.filter((t) => t.title.toLowerCase().includes(q));

        const start = (page - 1) * pageSize;
        const slice = filtered.slice(start, start + pageSize);

        return HttpResponse.json(slice);
    }),
];