import { useToasts, useRemoveToast } from '../store';

export function ToastList() {
  const toasts = useToasts();
  const removeToast = useRemoveToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type} fade-in`}
          role="status"
        >
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === 'success' && '🏮'}
              {toast.type === 'error' && '⚠️'}
              {toast.type === 'warning' && '⚡'}
              {toast.type === 'info' && '✍️'}
            </span>
            <span className="toast-text font-serif">{toast.text}</span>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="关闭提示"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
