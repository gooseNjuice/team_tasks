import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useGetTasksQuery, useUpdateTaskMutation, type TaskStatus } from "../../services/api";
import { selectTasksByTeamAndStatus } from "./tasksSlice";
import { setSelectedTaskId } from "../ui/uiSlice";

type KanbanBoardProps = {
    teamId: string;
};

const columns: Array<{ status: TaskStatus; title: string }> = [
    { status: "todo", title: "Todo" },
    { status: "in_progress", title: "In progress" },
    { status: "done", title: "Done" },
];

function nextStatus(status: TaskStatus, direction: "left" | "right") {
    const statuses: TaskStatus[] = ["todo", "in_progress", "done"];
    const currentIndex = statuses.indexOf(status);
    const nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    return statuses[nextIndex] ?? status;
}

export function KanbanBoard({ teamId }: KanbanBoardProps) {
    const dispatch = useAppDispatch();
    const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

    useGetTasksQuery({ teamId, status: "todo", page: 1, sort: "updated_desc" }, { pollingInterval: 30_000 });
    useGetTasksQuery({ teamId, status: "in_progress", page: 1, sort: "updated_desc" }, { pollingInterval: 30_000 });
    useGetTasksQuery({ teamId, status: "done", page: 1, sort: "updated_desc" }, { pollingInterval: 30_000 });

    const todoTasks = useAppSelector((state) => selectTasksByTeamAndStatus(state, teamId, "todo"));
    const inProgressTasks = useAppSelector((state) => selectTasksByTeamAndStatus(state, teamId, "in_progress"));
    const doneTasks = useAppSelector((state) => selectTasksByTeamAndStatus(state, teamId, "done"));

    const tasksByStatus = {
        todo: todoTasks,
        in_progress: inProgressTasks,
        done: doneTasks,
    };

    useEffect(() => {
        if (todoTasks[0]) {
            dispatch(setSelectedTaskId(todoTasks[0].id));
        }
    }, [dispatch, todoTasks]);

    return (
        <section className="panel">
            <div className="panel-header">
                <div>
                    <p className="eyebrow">Kanban board</p>
                    <h2>Move tasks across statuses</h2>
                </div>
                <span className="status-pill">Saving move: {String(isUpdating)}</span>
            </div>

            <div className="kanban-grid">
                {columns.map((column) => (
                    <section key={column.status} className="kanban-column">
                        <header className="kanban-column__header">
                            <h3>{column.title}</h3>
                            <span>{tasksByStatus[column.status].length}</span>
                        </header>

                        <ul className="kanban-list">
                            {tasksByStatus[column.status].map((task) => (
                                <li key={task.id} className="kanban-card">
                                    <button
                                        type="button"
                                        className="kanban-card__title"
                                        onClick={() => dispatch(setSelectedTaskId(task.id))}
                                    >
                                        {task.title}
                                    </button>
                                    <p>{task.description}</p>
                                    <div className="kanban-actions">
                                        <button
                                            type="button"
                                            className="ghost-button"
                                            disabled={task.status === "todo"}
                                            onClick={() => updateTask({ taskId: task.id, changes: { status: nextStatus(task.status, "left") } })}
                                        >
                                            ←
                                        </button>
                                        <span>{task.likes} likes</span>
                                        <button
                                            type="button"
                                            className="ghost-button"
                                            disabled={task.status === "done"}
                                            onClick={() => updateTask({ taskId: task.id, changes: { status: nextStatus(task.status, "right") } })}
                                        >
                                            →
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </section>
    );
}
