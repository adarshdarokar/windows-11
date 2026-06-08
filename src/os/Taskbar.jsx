import { useEffect, useRef, useState } from "react";
import { useOS } from "@/os/store";
import { useFS } from "@/os/fs";
import { APPS } from "@/os/apps";
import { Wifi, Volume2, BatteryFull, ChevronUp, Search, Sun, Moon, Bell, Scissors, Copy as CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import StartMenu from "./StartMenu";
import QuickSettings from "./QuickSettings";

function StartIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className={cn("transition-transform", active && "scale-110")}>
      <rect x="3" y="3" width="8" height="8" rx="1" fill="hsl(var(--primary))" />
      <rect x="13" y="3" width="8" height="8" rx="1" fill="hsl(var(--primary-glow))" />
      <rect x="3" y="13" width="8" height="8" rx="1" fill="hsl(var(--primary-glow))" />
      <rect x="13" y="13" width="8" height="8" rx="1" fill="hsl(var(--primary))" />
    </svg>
  );
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Taskbar() {
  const startOpen = useOS((s) => s.startOpen);
  const toggleStart = useOS((s) => s.toggleStart);
  const setStartOpen = useOS((s) => s.setStartOpen);
  const windows = useOS((s) => s.windows);
  const activeId = useOS((s) => s.activeId);
  const toggleMin = useOS((s) => s.toggleMinimize);
  const openApp = useOS((s) => s.openApp);
  const theme = useOS((s) => s.theme);
  const toggleTheme = useOS((s) => s.toggleTheme);
  const toggleNotif = useOS((s) => s.toggleNotif);
  const notifications = useOS((s) => s.notifications);
  const clipboard = useFS((s) => s.clipboard);
  const setClipboard = useFS((s) => s.setClipboard);

  const [quickOpen, setQuickOpen] = useState(false);
  const quickAnchorRef = useRef(null);

  const now = useClock();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { month: "numeric", day: "numeric", year: "numeric" });

  const pinned = ["files", "notepad", "settings"];
  const runningIds = [...new Set(windows.map((w) => w.appId))];
  const taskItems = [...new Set([...pinned, ...runningIds])];
  const ClipIcon = clipboard?.mode === "cut" ? Scissors : CopyIcon;

  return (
    <>
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} />
      <QuickSettings open={quickOpen} onClose={() => setQuickOpen(false)} anchorRef={quickAnchorRef} />

      <div className="fixed left-0 right-0 bottom-0 z-[10000] flex justify-center pointer-events-none">
        <div className="taskbar-surface mx-auto mb-1.5 mt-1.5 px-1.5 sm:px-2 h-11 sm:h-12 max-w-[calc(100vw-1rem)] rounded-xl flex items-center gap-0.5 sm:gap-1 pointer-events-auto shadow-acrylic overflow-x-auto scrollbar-thin">
          {/* Start */}
          <button
            onClick={() => { import("@/os/sounds").then(m => m.sounds.start()); toggleStart(); }}
            className={cn(
              "h-8 w-9 sm:h-9 sm:w-10 shrink-0 grid place-items-center rounded-md transition-colors",
              startOpen ? "bg-foreground/10" : "hover:bg-foreground/10"
            )}
            aria-label="Start"
          >
            <StartIcon active={startOpen} />
          </button>

          <button
            onClick={() => setStartOpen(true)}
            className="hidden sm:grid h-9 w-10 shrink-0 place-items-center rounded-md hover:bg-foreground/10 transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="hidden sm:block w-px h-6 bg-foreground/15 mx-1" />

          {/* Apps */}
          {taskItems.map((appId) => {
            const app = APPS[appId];
            if (!app) return null;
            const Icon = app.icon;
            const wins = windows.filter((w) => w.appId === appId);
            const isRunning = wins.length > 0;
            const isActive = wins.some((w) => w.id === activeId && !w.minimized);
            return (
              <button
                key={appId}
                onClick={() => {
                  if (wins.length === 0) {
                    openApp(appId, { title: app.name, size: app.defaultSize });
                  } else {
                    toggleMin(wins[0].id);
                  }
                }}
                className={cn(
                  "relative h-8 w-9 sm:h-9 sm:w-10 shrink-0 grid place-items-center rounded-md transition-all",
                  isActive ? "bg-foreground/15" : "hover:bg-foreground/10"
                )}
                title={app.name}
              >
                <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", app.color)} strokeWidth={1.75} />
                {isRunning && (
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all",
                      isActive ? "w-4 bg-primary" : "w-1.5 bg-foreground/60"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* System tray */}
        <div className="taskbar-surface absolute right-1.5 bottom-1.5 h-11 sm:h-12 px-1.5 sm:px-2 rounded-xl flex items-center gap-0.5 sm:gap-1 pointer-events-auto shadow-acrylic max-w-[calc(100vw-1rem)]">
          {clipboard?.ids?.length > 0 && (
            <button
              onClick={() => setClipboard(null)}
              className="hidden sm:flex h-9 px-2 rounded-md hover:bg-foreground/10 items-center gap-1.5 transition-colors text-xs"
              title={`${clipboard.ids.length} item(s) on clipboard — click to clear`}
            >
              <ClipIcon className={cn("w-3.5 h-3.5", clipboard.mode === "cut" ? "text-amber-400" : "text-primary")} />
              <span className="font-medium">{clipboard.ids.length}</span>
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="h-8 sm:h-9 px-1.5 sm:px-2 rounded-md hover:bg-foreground/10 grid place-items-center transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            ref={quickAnchorRef}
            onClick={() => setQuickOpen((v) => !v)}
            className={cn(
              "h-8 sm:h-9 px-1.5 sm:px-2 rounded-md flex items-center gap-1.5 sm:gap-2 transition-colors",
              quickOpen ? "bg-foreground/15" : "hover:bg-foreground/10"
            )}
            aria-label="Quick settings"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <Wifi className="w-4 h-4" />
            <Volume2 className="hidden sm:block w-4 h-4" />
            <BatteryFull className="hidden sm:block w-4 h-4" />
          </button>
          <button
            onClick={toggleNotif}
            className="relative h-8 sm:h-9 px-1.5 sm:px-2 rounded-md hover:bg-foreground/10 grid place-items-center transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold grid place-items-center">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>
          <button className="hidden sm:block h-9 px-2 rounded-md hover:bg-foreground/10 text-right leading-tight transition-colors">
            <div className="text-[12px] font-medium">{time}</div>
            <div className="text-[11px] text-muted-foreground">{date}</div>
          </button>
        </div>
      </div>
    </>
  );
}
