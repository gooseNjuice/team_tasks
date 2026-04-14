import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectTaskById } from "./tasksSlice";
import { setSelectedTaskId } from "../ui/uiSlice";
import { useGetTaskQuery, useToggleLikeMutation, useUpdateTaskMutation, type TaskStatus } from "../../services/api";

export function TaskDetails() {
    const dispatch = useAppDispatch();
    const selectedTaskId = useAppSelector((state) => state.ui.selectedTaskId);
    const indexedTask = useAppSelector((state) => selectTaskById(state, selectedTaskId));
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<TaskStatus>("todo");
    const [toggleLike, { isLoading: isToggling }] = useToggleLikeMutation();
    const [updateTask, { isLoading: isSaving }] = useUpdateTaskMutation();

    const { task, isLoading, isFetching, error } = useGetTaskQuery(selectedTaskId ? { taskId: selectedTaskId } : skipToken, {
        selectFromResult: ({ data, error, isFetching, isLoading }) => ({
            task: data,
            isLoading,
            isFetching,
            error,
        }),
    });

    const activeTask = task ?? indexedTask;

    useEffect(() => {
        if (!activeTask) {
            return;
        }

        setTitle(activeTask.title);
        setDescription(activeTask.description);
        setStatus(activeTask.status);
    }, [activeTask]);

    if (!selectedTaskId) {
        return (
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <p className="eyebrow">Task details</p>
                        <h2>Pick a task</h2>
                    </div>
                </div>
                <p className="empty-state">Select any task from the list or kanban board to inspect it here.</p>
            </section>
        );
    }

    async function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedTaskId) return;

        await updateTask({
            taskId: selectedTaskId,
            changes: {
                title,
                description,
                status,
            },
        }).unwrap();

        setIsEditing(false);
    }

    return (
        <section className="panel">
            <div className="panel-header">
                <div>
                    <p className="eyebrow">Task details</p>
                    <h2>{activeTask?.title ?? "Loading..."}</h2>
                </div>
                <button type="button" className="ghost-button" onClick={() => dispatch(setSelectedTaskId(null))}>
                    Clear
                </button>
            </div>

            <div className="fetch-state">
                <span>Initial load: {String(isLoading)}</span>
                <span>Background refresh: {String(isFetching)}</span>
            </div>

            {error ? <p className="empty-state">Could not load task details.</p> : null}

            {activeTask ? (
                <>
                    <div className="detail-card">
                        <p className="detail-description">{activeTask.description}</p>
                        <dl className="detail-grid">
                            <div>
                                <dt>ID</dt>
                                <dd>{activeTask.id}</dd>
                            </div>
                            <div>
                                <dt>Team</dt>
                                <dd>{activeTask.teamId}</dd>
                            </div>
                            <div>
                                <dt>Status</dt>
                                <dd>{activeTask.status}</dd>
                            </div>
                            <div>
                                <dt>Updated</dt>
                                <dd>{new Date(activeTask.updatedAt).toLocaleString()}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="detail-actions">
                        <button type="button" className="accent-button" onClick={() => toggleLike({ taskId: activeTask.id })} disabled={isToggling}>
                            {activeTask.likedByMe ? "Unlike" : "Like"} ({activeTask.likes})
                        </button>
                        <button type="button" className="ghost-button" onClick={() => setIsEditing((value) => !value)}>
                            {isEditing ? "Cancel edit" : "Edit task"}
                        </button>
                    </div>

                    {isEditing ? (
                        <form className="editor-form" onSubmit={handleSave}>
                            <label className="field">
                                <span>Title</span>
                                <input value={title} onChange={(event) => setTitle(event.target.value)} required />
                            </label>
                            <label className="field">
                                <span>Description</span>
                                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
                            </label>
                            <label className="field">
                                <span>Status</span>
                                <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
                                    <option value="todo">todo</option>
                                    <option value="in_progress">in_progress</option>
                                    <option value="done">done</option>
                                </select>
                            </label>
                            <button type="submit" className="accent-button" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Update task"}
                            </button>
                        </form>
                    ) : null}
                </>
            ) : null}
        </section>
    );
}
