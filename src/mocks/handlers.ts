import { delay, http, HttpResponse } from "msw";
import type { CreateTaskInput, Task, TaskSort, TaskStatus } from "../services/api";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const PAGE_SIZE = 10;

function makeTimestamp(index: number) {
    const base = new Date("2026-04-01T08:00:00.000Z").getTime();
    return new Date(base + index * 36_000_00).toISOString();
}

function makeTasks(teamId: string, count = 24): Task[] {
    return Array.from({ length: count }, (_, i) => {
        const id = `${teamId}-${i + 1}`;
        const status = STATUSES[i % STATUSES.length];

        return {
            id,
            teamId,
            title: `Task #${i + 1}`,
            description: `Detailed notes for task #${i + 1} owned by team ${teamId}.`,
            status,
            likes: (i * 7) % 13,
            likedByMe: i % 4 === 0,
            updatedAt: makeTimestamp(i),
        };
    });
}

const db = new Map<string, Task[]>();

function getDb(teamId: string) {
    if (!db.has(teamId)) {
        db.set(teamId, makeTasks(teamId));
    }

    return db.get(teamId)!;
}

function findTask(taskId: string) {
    for (const tasks of db.values()) {
        const task = tasks.find((item) => item.id === taskId);
        if (task) {
            return task;
        }
    }

    return null;
}

function sortTasks(tasks: Task[], sort: TaskSort) {
    const items = [...tasks];

    if (sort === "likes_desc") {
        return items.sort((a, b) => b.likes - a.likes);
    }

    if (sort === "title_asc") {
        return items.sort((a, b) => a.title.localeCompare(b.title));
    }

    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const handlers = [
    http.get("/api/teams/:teamId/tasks", async ({ params, request }) => {
        await delay(150);

        const teamId = String(params.teamId);
        const url = new URL(request.url);
        const status = url.searchParams.get("status") as TaskStatus | null;
        const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
        const page = Number(url.searchParams.get("page") ?? "1");
        const sort = (url.searchParams.get("sort") ?? "updated_desc") as TaskSort;

        let filtered = getDb(teamId);

        if (status) {
            filtered = filtered.filter((task) => task.status === status);
        }

        if (q) {
            filtered = filtered.filter((task) => {
                return task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q);
            });
        }

        const ordered = sortTasks(filtered, sort);
        const start = (page - 1) * PAGE_SIZE;

        return HttpResponse.json({
            items: ordered.slice(start, start + PAGE_SIZE),
            total: ordered.length,
            page,
            pageSize: PAGE_SIZE,
        });
    }),

    http.post("/api/teams/:teamId/tasks", async ({ params, request }) => {
        await delay(180);

        const teamId = String(params.teamId);
        const body = (await request.json()) as CreateTaskInput;
        const teamTasks = getDb(teamId);
        const task: Task = {
            id: `${teamId}-${teamTasks.length + 1}`,
            teamId,
            title: body.title,
            description: body.description,
            status: body.status,
            likes: 0,
            likedByMe: false,
            updatedAt: new Date().toISOString(),
        };

        teamTasks.unshift(task);

        return HttpResponse.json(task, { status: 201 });
    }),

    http.get("/api/tasks/:taskId", async ({ params }) => {
        await delay(90);

        const task = findTask(String(params.taskId));

        if (!task) {
            return HttpResponse.json({ message: "Task not found" }, { status: 404 });
        }

        return HttpResponse.json(task);
    }),

    http.patch("/api/tasks/:taskId", async ({ params, request }) => {
        await delay(140);

        const task = findTask(String(params.taskId));

        if (!task) {
            return HttpResponse.json({ message: "Task not found" }, { status: 404 });
        }

        const body = (await request.json()) as Partial<Pick<Task, "title" | "description" | "status">>;

        Object.assign(task, body, { updatedAt: new Date().toISOString() });

        return HttpResponse.json(task);
    }),

    http.post("/api/tasks/:taskId/toggle-like", async ({ params }) => {
        await delay(120);

        const task = findTask(String(params.taskId));

        if (!task) {
            return HttpResponse.json({ message: "Task not found" }, { status: 404 });
        }

        task.likedByMe = !task.likedByMe;
        task.likes += task.likedByMe ? 1 : -1;
        task.updatedAt = new Date().toISOString();

        return HttpResponse.json(task);
    }),
];
