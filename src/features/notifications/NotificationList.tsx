import { removeNotification } from "./notificationsSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

export function NotificationList() {
    const dispatch = useAppDispatch();
    const notifications = useAppSelector((state) => state.notifications.items);

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="notification-stack" aria-live="polite">
            {notifications.map((notification) => (
                <article key={notification.id} className="notification">
                    <p>{notification.message}</p>
                    <button type="button" className="ghost-button" onClick={() => dispatch(removeNotification(notification.id))}>
                        Dismiss
                    </button>
                </article>
            ))}
        </div>
    );
}
