export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastAlert {
  message: string;
  type: ToastType;
}

interface ToastProps {
  alert: ToastAlert;
  onClose: () => void;
}

const TITLE_BY_TYPE: Record<ToastType, string> = {
  error: 'Error',
  success: 'Éxito',
  warning: 'Advertencia',
  info: 'Info',
};

export default function Toast({ alert, onClose }: ToastProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`toast toast-${alert.type}`}
      style={{
        pointerEvents: 'auto',
        animation: 'none',
        width: '100%',
        position: 'relative',
        right: 'auto',
        bottom: 'auto',
        marginBottom: 20,
      }}
    >
      <div className="toast-content">
        <span className="toast-title" style={{ fontSize: '10px' }}>{TITLE_BY_TYPE[alert.type]}</span>
        <span className="toast-message" style={{ fontSize: '12px' }}>{alert.message}</span>
      </div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Cerrar">&times;</button>
    </div>
  );
}
