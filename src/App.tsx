import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useState } from "react";
import "./App.css";
import { useGetTaskQuery, useGetTasksQuery } from "./services/api";

const teamId = "t1";

export default function App() {
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const { data: tasks = [], isLoading, isFetching, error } = useGetTasksQuery({
        teamId,
        status: "todo",
        page: 1,
    });

    useEffect(() => {
        if (!selectedTaskId && tasks.length > 0) {
            setSelectedTaskId(tasks[0].id);
        }
    }, [selectedTaskId, tasks]);

    const selectedTaskQueryArg = selectedTaskId ? { teamId, taskId: selectedTaskId } : skipToken;
    const {
        data: selectedTask,
        isLoading: isTaskLoading,
        isFetching: isTaskFetching,
        error: selectedTaskError,
    } = useGetTaskQuery(selectedTaskQueryArg);

    if (isLoading) return <div className="app-state">Loading...</div>;
    if (error) return <div className="app-state">Could not load tasks.</div>;

    return (
        <main className="app-shell">
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <p className="eyebrow">Team board</p>
                        <h1>Team Tasks</h1>
                    </div>
                    <span className="status-pill">Refreshing: {String(isFetching)}</span>
                </div>

                <ul className="task-list">
                    {tasks.map((task) => {
                        const isActive = task.id === selectedTaskId;

                        return (
                            <li key={task.id}>
                                <button
                                    className={`task-card${isActive ? " task-card--active" : ""}`}
                                    type="button"
                                    onClick={() => setSelectedTaskId(task.id)}
                                >
                                    <span className="task-card__title">{task.title}</span>
                                    <span className="task-card__meta">
                                        <strong>{task.status}</strong>
                                        <span>likes: {task.likes}</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <aside className="panel panel--detail">
                <div className="panel-header">
                    <div>
                        <p className="eyebrow">Selected task</p>
                        <h2>Details</h2>
                    </div>
                    {selectedTaskId ? (
                        <span className="status-pill">Updating: {String(isTaskFetching)}</span>
                    ) : null}
                </div>

                {!selectedTaskId ? <p className="empty-state">Pick a task to see its details.</p> : null}
                {isTaskLoading ? <p className="empty-state">Loading task...</p> : null}
                {selectedTaskError ? <p className="empty-state">Could not load the selected task.</p> : null}

                {selectedTask ? (
                    <div className="detail-card">
                        <h3>{selectedTask.title}</h3>
                        <dl className="detail-grid">
                            <div>
                                <dt>ID</dt>
                                <dd>{selectedTask.id}</dd>
                            </div>
                            <div>
                                <dt>Team</dt>
                                <dd>{selectedTask.teamId}</dd>
                            </div>
                            <div>
                                <dt>Status</dt>
                                <dd>{selectedTask.status}</dd>
                            </div>
                            <div>
                                <dt>Likes</dt>
                                <dd>{selectedTask.likes}</dd>
                            </div>
                            <div>
                                <dt>Liked by me</dt>
                                <dd>{selectedTask.likedByMe ? "Yes" : "No"}</dd>
                            </div>
                        </dl>
                    </div>
                ) : null}
            </aside>
        </main>
    );
}
