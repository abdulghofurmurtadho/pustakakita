import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastItem, ToastType, useToast } from '../../context/ToastContext';

const TOAST_STYLES: Record<
  ToastType,
  { container: string; icon: typeof CheckCircle2; iconColor: string }
> = {
  success: {
    container: 'border-emerald-200 bg-emerald-50/95 text-emerald-950',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  error: {
    container: 'border-rose-200 bg-rose-50/95 text-rose-950',
    icon: AlertCircle,
    iconColor: 'text-rose-600',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50/95 text-amber-950',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  info: {
    container: 'border-slate-200 bg-white/95 text-slate-900',
    icon: Info,
    iconColor: 'text-indigo-600',
  },
};

function ToastRow({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: (id: string) => void;
}) {
  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${style.container}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} />
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-xs font-semibold">{toast.title}</p>}
        <p className="text-xs leading-relaxed opacity-90">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="rounded p-0.5 opacity-60 transition hover:opacity-100"
        aria-label="Tutup notifikasi"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2.5">
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}
