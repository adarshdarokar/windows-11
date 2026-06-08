import { useOS } from "@/os/store";
import { Bell, X, Trash2, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (ts) => {
  const d = new Date(ts);
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
};

export default function NotificationCenter() {
  const open = useOS((s) => s.notifOpen);
  const setOpen = useOS((s) => s.setNotifOpen);
  const notifications = useOS((s) => s.notifications);
  const clearAll = useOS((s) => s.clearNotifications);
  const dismiss = useOS((s) => s.dismissNotification);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[10500] bg-black/10 animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed right-1.5 bottom-[68px] w-[360px] max-w-[95vw] max-h-[70vh] z-[10501] start-surface rounded-xl shadow-acrylic flex flex-col transition-all duration-300",
          open ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-[120%] opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
        aria-label="Notification center"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Notifications</span>
            {notifications.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                {notifications.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] px-2 h-7 rounded-md hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title="Clear all"
              >
                <CheckCheck className="w-3 h-3" /> Clear
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 grid place-items-center rounded-md hover:bg-foreground/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin px-3 pb-3 space-y-1.5">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Bell className="w-8 h-8 opacity-40" strokeWidth={1.25} />
              No new notifications
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = n.icon || Bell;
              return (
                <div
                  key={n.id}
                  className="group relative rounded-lg bg-background/70 border border-border p-3 hover:bg-background transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-md grid place-items-center shrink-0",
                        n.tone === "destructive" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      {n.body && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1">{fmt(n.ts)}</div>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 grid place-items-center rounded hover:bg-foreground/10 transition-all"
                      aria-label="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
