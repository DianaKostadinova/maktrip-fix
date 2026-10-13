import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const noop = () => {};
const ToastContext = createContext({ show: noop, success: noop, error: noop, info: noop });

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    const toast = useCallback(
        (message, { type = 'info', action, duration = 3800 } = {}) => {
            const id = crypto.randomUUID?.() ?? String(Math.random());
            setToasts((t) => [...t.slice(-2), { id, message, type, action }]);
            if (duration) setTimeout(() => dismiss(id), duration);
        },
        [dismiss]
    );

    const api = useMemo(() => {
        return {
            show: toast,
            success: (m, o) => toast(m, { ...o, type: 'success' }),
            error: (m, o) => toast(m, { ...o, type: 'error', duration: 6000 }),
            info: (m, o) => toast(m, { ...o, type: 'info' }),
        };
    }, [toast]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="toast-stack" role="status" aria-live="polite">
                {toasts.map(({ id, message, type, action }) => {
                    const Icon = ICONS[type];
                    return (
                        <div key={id} className={`toast toast--${type}`}>
                            <Icon size={18} aria-hidden />
                            <span>{message}</span>
                            {action && (
                                <button
                                    className="toast__action"
                                    onClick={() => {
                                        action.onClick();
                                        dismiss(id);
                                    }}
                                >
                                    {action.label}
                                </button>
                            )}
                            <button className="icon-btn icon-btn--sm" aria-label="Dismiss" onClick={() => dismiss(id)}>
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
