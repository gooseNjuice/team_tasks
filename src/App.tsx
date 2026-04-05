import { useGetTasksQuery } from "./services/api";

export default function App() {
    const { data, isLoading, isFetching, error } = useGetTasksQuery({ teamId: "t1", status: "todo", page: 1 });

    if (isLoading) return <div>Loading…</div>;
    if (error) return <div>Error</div>;

    return (
        <div style={{ padding: 16 }}>
            <h1>Team Tasks</h1>
            <div>isFetching: {String(isFetching)}</div>
            <ul>
                {(data ?? []).map((t) => (
                    <li key={t.id}>
                        {t.title} — <b>{t.status}</b> — likes: {t.likes}
                    </li>
                ))}
            </ul>
        </div>
    );
}