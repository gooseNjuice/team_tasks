import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {Provider} from "react-redux";
import {store} from "./app/store.ts";

async function enableMocking() {
    if (!import.meta.env.DEV) return;
    const {worker} = await import("./mocks/browser");
    await worker.start({
        onUnhandledRequest: "bypass",
    });
}

enableMocking().then(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <Provider store={store}>
                <App/>
            </Provider>
        </StrictMode>,
    )
})