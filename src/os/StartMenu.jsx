import { useEffect, useState, useMemo } from "react";
import { Search, Power, User, Folder, FileText, Lock } from "lucide-react";
import { useOS } from "@/os/store";
import { useFS } from "@/os/fs";
import { APPS, PINNED_APPS, iconForFsNode, colorForFsNode } from "@/os/apps";
import { sounds } from "@/os/sounds";
import { cn } from "@/lib/utils";

export default function StartMenu({ open, onClose }) {
  const openApp = useOS((s) => s.openApp);
  const nodes = useFS((s) => s.nodes);
  const search = useFS((s) => s.search);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 90);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onClick = (e) => {
      if (!e.target.closest("[data-start-menu]") && !e.target.closest("[aria-label='Start']") && !e.target.closest("[aria-label='Search']")) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  const matchedApps = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return PINNED_APPS;
    return PINNED_APPS.filter((id) => APPS[id].name.toLowerCase().includes(q));
  }, [debounced]);

  const matchedFiles = useMemo(() => {
    if (!debounced.trim()) return [];
    return search(debounced, "root").slice(0, 8);
  }, [debounced, nodes, search]);

  const handleOpenApp = (id) => {
    const app = APPS[id];
    sounds.click();
    openApp(id, { title: app.name, size: app.defaultSize });
    onClose();
  };

  const handleOpenFile = (node) => {
    sounds.click();
    if (node.type === "folder") {
      openApp("files", {
        title: node.name,
        size: APPS.files.defaultSize,
        allowMultiple: true,
        props: { startId: node.id },
      });
    } else {
      openApp(node.appId || "notepad", {
        title: node.name,
        allowMultiple: true,
        size: { width: 680, height: 480 },
        props: { fileId: node.id },
      });
    }
    onClose();
  };

  if (!open) return null;
  const showResults = debounced.trim().length > 0;

  return (
    <div
      data-start-menu
      className="fixed left-1/2 -translate-x-1/2 bottom-[68px] w-[640px] max-w-[95vw] start-surface rounded-xl shadow-acrylic z-[10001] animate-start-in p-4 sm:p-6"
    >
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search apps, files, settings"
          className="w-full h-10 pl-10 pr-3 rounded-md bg-background/60 border border-border outline-none focus:ring-2 focus:ring-primary/40 text-sm"
        />
      </div>

      {showResults ? (
        <div className="max-h-[420px] overflow-auto scrollbar-thin -mx-2 px-2">
          {matchedApps.length > 0 && (
            <>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 px-1">Apps</div>
              <div className="grid grid-cols-1 gap-0.5 mb-3">
                {matchedApps.map((id) => {
                  const app = APPS[id];
                  const Icon = app.icon;
                  return (
                    <button
                      key={id}
                      onClick={() => handleOpenApp(id)}
                      className="flex items-center gap-3 h-10 px-2 rounded-md hover:bg-foreground/10 text-left transition-colors"
                    >
                      <Icon className={cn("w-5 h-5", app.color)} strokeWidth={1.75} />
                      <span className="text-sm">{app.name}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground">App</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {matchedFiles.length > 0 && (
            <>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 px-1">Files & folders</div>
              <div className="grid grid-cols-1 gap-0.5">
                {matchedFiles.map((n) => {
                  const Icon = iconForFsNode(n);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleOpenFile(n)}
                      className="flex items-center gap-3 h-10 px-2 rounded-md hover:bg-foreground/10 text-left transition-colors"
                    >
                      <Icon className={cn("w-5 h-5", colorForFsNode(n))} strokeWidth={1.75} />
                      <span className="text-sm truncate">{n.name}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground capitalize">{n.type}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {matchedApps.length === 0 && matchedFiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No results for “{debounced}”</div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wide">Pinned</span>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">All apps ›</button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {PINNED_APPS.map((id) => {
              const app = APPS[id];
              const Icon = app.icon;
              return (
                <button
                  key={id}
                  onClick={() => handleOpenApp(id)}
                  className="flex flex-col items-center justify-center gap-2 py-4 rounded-lg hover:bg-foreground/8 transition-colors group"
                >
                  <Icon className={cn("w-9 h-9 transition-transform group-hover:scale-105", app.color)} strokeWidth={1.5} />
                  <span className="text-[12px] text-center leading-tight">{app.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground grid place-items-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Adarsh Darokar</span>
        </div>
        <button
          onClick={() => { onClose(); useOS.getState().lock(); }}
          className="w-9 h-9 grid place-items-center rounded-md hover:bg-foreground/10 transition-colors"
          aria-label="Lock"
          title="Lock"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
