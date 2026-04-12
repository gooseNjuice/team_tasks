import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type Notification = {
    id: string;
    message: string;
};

type NotificationsState = {
    items: Notification[];
};

const initialState: NotificationsState = {
    items: [],
};

const notificationsSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        enqueueNotification: {
            reducer: (state, action: PayloadAction<Notification>) => {
                state.items.unshift(action.payload);
            },
            prepare: (message: string) => ({
                payload: {
                    id: nanoid(),
                    message,
                },
            }),
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter((item) => item.id !== action.payload);
        },
    },
});

export const { enqueueNotification, removeNotification } = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;
