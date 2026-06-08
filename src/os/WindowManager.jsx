import { useEffect, useRef, useState, memo, useCallback, Suspense } from "react";
import { useOS, MIN_SIZE } from "@/os/store";
import { APPS } from "@/os/apps";
import { sounds } from "@/os/sounds";
import { Minus, Square, X, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const TASKBAR_H = 56;
const SNAP_EDGE = 18;

function useViewportTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const onR = () => setTick((t) => t + 1);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
}

function Window({ win }) {
  useViewportTick();
  const isActive = useOS((s) => s.activeId === win.id);
  const focusWindow = useOS((s) => s.focusWindow);
  const closeWindow = useOS((s) => s.closeWindow);
  const minimizeWindow = useOS((s) => s.minimizeWindow);
  const toggleMaximize = useOS((s) => s.toggleMaximize);
  const snapWindow = useOS((s) => s.snapWindow);
  const unsnap = useOS((s) => s.unsnap);
  const updateGeom = useOS((s) => s.updateWindowGeometry);

  const app = APPS[win.appId];
  const Icon = app?.icon;
  const Body = app?.component;

  const ref = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const [snapHint, setSnapHint] = useState(null);

  // ---- DRAG ----
  const onTitleDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      // ignore clicks on buttons inside titlebar
      if (e.target.closest("button")) return;
      focusWindow(win.id);
      const startX = e.clientX;
      const startY = e.clientY;
      let originX = win.x;
      let originY = win.y;

      // If snapped/maximized, "tear off" to cursor
      if (win.maximized || win.snap) {
        const w = win.prev?.width || 720;
        const h = win.prev?.height || 480;
        originX = e.clientX - w / 2;
        originY = 8;
        updateGeom(win.id, { maximized: false, snap: null, prev: null, x: originX, y: originY, width: w, height: h });
      }

      dragRef.current = { startX, startY, originX, originY };
      document.body.style.cursor = "grabbing";

      let raf = 0;
      let pending = null;
      const flush = () => {
        raf = 0;
        if (pending) updateGeom(win.id, pending);
        pending = null;
      };
      const onMove = (ev) => {
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        const x = Math.max(-200, dragRef.current.originX + dx);
        const y = Math.max(0, Math.min(window.innerHeight - TASKBAR_H - 40, dragRef.current.originY + dy));
        pending = { x, y };
        if (!raf) raf = requestAnimationFrame(flush);

        if (ev.clientX <= SNAP_EDGE) setSnapHint("left");
        else if (ev.clientX >= window.innerWidth - SNAP_EDGE) setSnapHint("right");
        else if (ev.clientY <= SNAP_EDGE) setSnapHint("max");
        else setSnapHint(null);
      };
      const onUp = (ev) => {
        if (raf) cancelAnimationFrame(raf);
        if (pending) updateGeom(win.id, pending);
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        if (ev.clientX <= SNAP_EDGE) snapWindow(win.id, "left");
        else if (ev.clientX >= window.innerWidth - SNAP_EDGE) snapWindow(win.id, "right");
        else if (ev.clientY <= SNAP_EDGE) toggleMaximize(win.id);
        setSnapHint(null);
        dragRef.current = null;
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [win, focusWindow, updateGeom, snapWindow, toggleMaximize]
  );

  // ---- RESIZE ----
  const startResize = useCallback(
    (dir) => (e) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      focusWindow(win.id);
      if (win.maximized || win.snap) return;
      resizeRef.current = {
        dir,
        startX: e.clientX,
        startY: e.clientY,
        x: win.x,
        y: win.y,
        w: win.width,
        h: win.height,
      };

      const cursors = {
        e: "ew-resize", w: "ew-resize",
        n: "ns-resize", s: "ns-resize",
        ne: "nesw-resize", sw: "nesw-resize",
        nw: "nwse-resize", se: "nwse-resize",
      };
      document.body.style.cursor = cursors[dir];

      let raf = 0;
      let pending = null;
      const flush = () => { raf = 0; if (pending) updateGeom(win.id, pending); pending = null; };
      const onMove = (ev) => {
        const r = resizeRef.current;
        if (!r) return;
        const dx = ev.clientX - r.startX;
        const dy = ev.clientY - r.startY;
        let { x, y, w, h } = r;

        if (dir.includes("e")) w = Math.max(MIN_SIZE.width, r.w + dx);
        if (dir.includes("s")) h = Math.max(MIN_SIZE.height, r.h + dy);
        if (dir.includes("w")) {
          const newW = Math.max(MIN_SIZE.width, r.w - dx);
          x = r.x + (r.w - newW); w = newW;
        }
        if (dir.includes("n")) {
          const newH = Math.max(MIN_SIZE.height, r.h - dy);
          y = Math.max(0, r.y + (r.h - newH)); h = newH;
        }
        pending = { x, y, width: w, height: h };
        if (!raf) raf = requestAnimationFrame(flush);
      };
      const onUp = () => {
        if (raf) cancelAnimationFrame(raf);
        if (pending) updateGeom(win.id, pending);
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        resizeRef.current = null;
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [win, focusWindow, updateGeom]
  );

  // Open/close sound on mount/unmount
  useEffect(() => {
    sounds.open();
    return () => sounds.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  if (win.minimized) return null;

  // Compute style based on snap/maximize.
  // On small screens (tablet/mobile) force fullscreen for usability — windowed dragging/resizing
  // is impractical on tiny viewports.
  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 768;
  let style;
  if (win.maximized || isSmallScreen) {
    style = { left: 0, top: 0, width: "100vw", height: `calc(100vh - ${TASKBAR_H}px)` };
  } else if (win.snap === "left") {
    style = { left: 0, top: 0, width: "50vw", height: `calc(100vh - ${TASKBAR_H}px)` };
  } else if (win.snap === "right") {
    style = { left: "50vw", top: 0, width: "50vw", height: `calc(100vh - ${TASKBAR_H}px)` };
  } else {
    // Clamp windowed size to viewport on smaller (tablet) screens so nothing overflows.
    const vw = typeof window !== "undefined" ? window.innerWidth : win.width;
    const vh = typeof window !== "undefined" ? window.innerHeight - TASKBAR_H : win.height;
    const w = Math.min(win.width, vw - 8);
    const h = Math.min(win.height, vh - 8);
    const x = Math.max(0, Math.min(win.x, vw - w));
    const y = Math.max(0, Math.min(win.y, vh - h));
    style = { left: x, top: y, width: w, height: h };
  }

  return (
    <>
      {snapHint && (
        <div
          className="fixed bg-primary/20 border-2 border-primary rounded-xl pointer-events-none animate-fade-in"
          style={
            snapHint === "left"
              ? { left: 0, top: 0, width: "50vw", height: `calc(100vh - ${TASKBAR_H}px)`, zIndex: 9999 }
              : snapHint === "right"
              ? { left: "50vw", top: 0, width: "50vw", height: `calc(100vh - ${TASKBAR_H}px)`, zIndex: 9999 }
              : { left: 0, top: 0, width: "100vw", height: `calc(100vh - ${TASKBAR_H}px)`, zIndex: 9999 }
          }
        />
      )}
      <div
        ref={ref}
        className={cn(
          "absolute window-surface rounded-xl overflow-hidden flex flex-col animate-window-in pointer-events-auto",
          isActive ? "ring-1 ring-primary/30" : "opacity-[0.985]"
        )}
        style={{ ...style, zIndex: win.z, transition: dragRef.current || resizeRef.current ? "none" : "box-shadow 200ms" }}
        onMouseDown={() => focusWindow(win.id)}
      >
        {/* Title bar — macOS style */}
        <div
          className="h-9 flex items-center px-3 select-none relative border-b border-border/50"
          style={{ background: "hsl(var(--window-header))" }}
          onMouseDown={onTitleDown}
          onDoubleClick={() => toggleMaximize(win.id)}
        >
          {/* Traffic lights (left) */}
          <div className="flex items-center gap-2 group/tl shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-95 grid place-items-center ring-1 ring-black/10"
              aria-label="Close"
            >
              <X className="w-[8px] h-[8px] text-black/60 opacity-0 group-hover/tl:opacity-100 transition-opacity" strokeWidth={3} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
              className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-95 grid place-items-center ring-1 ring-black/10"
              aria-label="Minimize"
            >
              <Minus className="w-[8px] h-[8px] text-black/60 opacity-0 group-hover/tl:opacity-100 transition-opacity" strokeWidth={3} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
              className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-95 grid place-items-center ring-1 ring-black/10"
              aria-label="Maximize"
            >
              <Square className="w-[7px] h-[7px] text-black/60 opacity-0 group-hover/tl:opacity-100 transition-opacity" strokeWidth={3} />
            </button>
          </div>

          {/* Centered title */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 min-w-0 max-w-[60%] pointer-events-none">
            {Icon && <Icon className={cn("w-3.5 h-3.5 shrink-0", app.color)} />}
            <span className="text-[13px] font-semibold truncate text-foreground/85">{win.title}</span>
          </div>

          {/* Right spacer to balance layout */}
          <div className="ml-auto w-[60px]" />
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-hidden bg-background">
          <Suspense fallback={<div className="h-full grid place-items-center text-sm text-muted-foreground">Loading…</div>}>
            {Body && <Body winId={win.id} props={win.props} />}
          </Suspense>
        </div>

        {/* Resize handles */}
        {!win.maximized && !win.snap && (
          <>
            <div onMouseDown={startResize("n")} className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize" />
            <div onMouseDown={startResize("s")} className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize" />
            <div onMouseDown={startResize("e")} className="absolute top-2 bottom-2 right-0 w-1 cursor-ew-resize" />
            <div onMouseDown={startResize("w")} className="absolute top-2 bottom-2 left-0 w-1 cursor-ew-resize" />
            <div onMouseDown={startResize("nw")} className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize" />
            <div onMouseDown={startResize("ne")} className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize" />
            <div onMouseDown={startResize("sw")} className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize" />
            <div onMouseDown={startResize("se")} className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize" />
          </>
        )}
      </div>
    </>
  );
}

const MemoWindow = memo(Window);

export default function WindowManager() {
  const windows = useOS((s) => s.windows);
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 pointer-events-none">
        {windows.map((w) => (
          <MemoWindow key={w.id} win={w} />
        ))}
      </div>
    </div>
  );
}
