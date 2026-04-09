import "./App.css";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { NotificationList } from "./features/notifications/NotificationList";
import { TaskDetails } from "./features/tasks/TaskDetails";
import { TaskListPage } from "./features/tasks/TaskListPage";
import { KanbanBoard } from "./features/tasks/KanbanBoard";
import { selectTaskCountsByStatus, selectTopTasksByLikes } from "./features/tasks/tasksSlice";
import { setActiveView } from "./features/ui/uiSlice";

export default function App() {
    const dispatch = useAppDispatch();
    const teamId = useAppSelector((state) => state.ui.teamId);
    const activeView = useAppSelector((state) => state.ui.activeView);
    const topTasks = useAppSelector((state) => selectTopTasksByLikes(state, teamId));
    const taskCounts = useAppSelector((state) => selectTaskCountsByStatus(state, teamId));

    return (
        <main className="app-shell">
            <NotificationList />

            <header className="hero">
                <div>
                    <p className="eyebrow">Offline-feeling workflow</p>
                    <h1>Team Tasks</h1>
                    <p className="hero-copy">
                        RTK Query handles server state, entity selectors keep local reads fast, and the UI keeps
                        moving while background refetches happen.
                    </p>
                </div>

                <div className="view-switcher" role="tablist" aria-label="View switcher">
                    <button
                        type="button"
                        className={activeView === "list" ? "switch-pill switch-pill--active" : "switch-pill"}
                        onClick={() => dispatch(setActiveView("list"))}
                    >
                        List
                    </button>
                    <button
                        type="button"
                        className={activeView === "kanban" ? "switch-pill switch-pill--active" : "switch-pill"}
                        onClick={() => dispatch(setActiveView("kanban"))}
                    >
                        Kanban
                    </button>
                </div>
            </header>

            <section className="summary-grid">
                <article className="summary-card">
                    <p className="summary-label">Todo</p>
                    <strong>{taskCounts.todo}</strong>
                </article>
                <article className="summary-card">
                    <p className="summary-label">In progress</p>
                    <strong>{taskCounts.in_progress}</strong>
                </article>
                <article className="summary-card">
                    <p className="summary-label">Done</p>
                    <strong>{taskCounts.done}</strong>
                </article>
            </section>

            <section className="workspace-grid">
                <div className="workspace-main">
                    {activeView === "list" ? <TaskListPage teamId={teamId} /> : <KanbanBoard teamId={teamId} />}
                </div>

                <aside className="workspace-side">
                    <TaskDetails />

                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <p className="eyebrow">Memoized selector</p>
                                <h2>Top liked</h2>
                            </div>
                        </div>

                        <ul className="top-list">
                            {topTasks.map((task) => (
                                <li key={task.id} className="top-list__item">
                                    <span>{task.title}</span>
                                    <strong>{task.likes}</strong>
                                </li>
                            ))}
                        </ul>
                    </section>
                </aside>
            </section>
        </main>
    );
}
