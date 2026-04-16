import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PAGE_SIZE, useCreateTaskMutation, useGetTasksQuery, type TaskStatus } from "../../services/api";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    setCreateFormOpen,
    setPage,
    setSearchQuery,
    setSelectedTaskId,
    setSort,
    setStatusFilter,
    type FilterStatus,
} from "../ui/uiSlice";

type TaskListPageProps = {
    teamId: string;
};

const statusOptions: FilterStatus[] = ["all", "todo", "in_progress", "done"];

export function TaskListPage({ teamId }: TaskListPageProps) {
    const dispatch = useAppDispatch();
    const filters = useAppSelector((state) => state.ui.filters);
    const selectedTaskId = useAppSelector((state) => state.ui.selectedTaskId);
    const isCreateFormOpen = useAppSelector((state) => state.ui.isCreateFormOpen);
    const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<TaskStatus>("todo");

    const queryArgs = useMemo(
        () => ({
            teamId,
            status: filters.status === "all" ? undefined : filters.status,
            q: filters.q || undefined,
            page: filters.page,
            sort: filters.sort,
        }),
        [filters.page, filters.q, filters.sort, filters.status, teamId],
    );

    const { items, total, page, isLoading, isFetching, error } = useGetTasksQuery(queryArgs, {
        pollingInterval: 30_000,
        selectFromResult: ({ data, error, isFetching, isLoading }) => ({
            items: data?.items ?? [],
            total: data?.total ?? 0,
            page: data?.page ?? queryArgs.page ?? 1,
            isLoading,
            isFetching,
            error,
        }),
    });

    useEffect(() => {
        if (!items.length) {
            dispatch(setSelectedTaskId(null));
            return;
        }

        if (!selectedTaskId || !items.some((task) => task.id === selectedTaskId)) {
            dispatch(setSelectedTaskId(items[0].id));
        }
    }, [dispatch, items, selectedTaskId]);

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const created = await createTask({
            teamId,
            title,
            description,
            status,
        }).unwrap();

        setTitle("");
        setDescription("");
        setStatus("todo");
        dispatch(setCreateFormOpen(false));
        dispatch(setSelectedTaskId(created.id));
        dispatch(setStatusFilter("all"));
        dispatch(setPage(1));
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <section className="panel">
            <div className="panel-header">
                <div>
                    <p className="eyebrow">Task list</p>
                    <h2>Browse and filter</h2>
                </div>
                <button
                    type="button"
                    className="accent-button"
                    onClick={() => dispatch(setCreateFormOpen(!isCreateFormOpen))}
                >
                    {isCreateFormOpen ? "Close" : "Create"}
                </button>
            </div>

            <div className="toolbar">
                <label className="field">
                    <span>Status</span>
                    <select
                        value={filters.status}
                        onChange={(event) => dispatch(setStatusFilter(event.target.value as FilterStatus))}
                    >
                        {statusOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="field">
                    <span>Search</span>
                    <input
                        value={filters.q}
                        onChange={(event) => dispatch(setSearchQuery(event.target.value))}
                        placeholder="Find by title or description"
                    />
                </label>

                <label className="field">
                    <span>Sort</span>
                    <select
                        value={filters.sort}
                        onChange={(event) => dispatch(setSort(event.target.value as typeof filters.sort))}
                    >
                        <option value="updated_desc">Recently updated</option>
                        <option value="likes_desc">Most liked</option>
                        <option value="title_asc">Title A-Z</option>
                    </select>
                </label>
            </div>

            <div className="fetch-state">
                <span>Initial load: {String(isLoading)}</span>
                <span>Background refresh: {String(isFetching)}</span>
                <span>Total: {total}</span>
            </div>

            {isCreateFormOpen ? (
                <form className="editor-form" onSubmit={handleCreate}>
                    <label className="field">
                        <span>Title</span>
                        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
                    </label>

                    <label className="field">
                        <span>Description</span>
                        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
                    </label>

                    <label className="field">
                        <span>Status</span>
                        <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
                            <option value="todo">todo</option>
                            <option value="in_progress">in_progress</option>
                            <option value="done">done</option>
                        </select>
                    </label>

                    <button type="submit" className="accent-button" disabled={isCreating}>
                        {isCreating ? "Creating..." : "Save task"}
                    </button>
                </form>
            ) : null}

            {error ? <p className="empty-state">Could not load the filtered task list.</p> : null}

            <ul className="task-list">
                {items.map((task) => {
                    const isActive = task.id === selectedTaskId;

                    return (
                        <li key={task.id}>
                            <button
                                type="button"
                                className={isActive ? "task-card task-card--active" : "task-card"}
                                onClick={() => dispatch(setSelectedTaskId(task.id))}
                            >
                                <span className="task-card__title">{task.title}</span>
                                <span className="task-card__description">{task.description}</span>
                                <span className="task-card__meta">
                                    <strong>{task.status}</strong>
                                    <span>{task.likes} likes</span>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <div className="pagination">
                <button type="button" className="ghost-button" onClick={() => dispatch(setPage(page - 1))} disabled={page <= 1}>
                    Prev
                </button>
                <span>
                    Page {page} / {totalPages}
                </span>
                <button
                    type="button"
                    className="ghost-button"
                    onClick={() => dispatch(setPage(page + 1))}
                    disabled={page >= totalPages}
                >
                    Next
                </button>
            </div>
        </section>
    );
}
