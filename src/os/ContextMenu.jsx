import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Lightweight context menu.
 * Usage:
 *  const { open, menuProps } = useContextMenu();
 *  <div onContextMenu={(e) => open(e, items)} />
 *  <ContextMenu {...menuProps} />
 *
 * items: [{ label, icon?, onClick, danger?, disabled?, separator? }]
 */

export function useContextMenu() {
  const [state, setState] = useState({ open: false, x: 0, y: 0, items: [] });
  const open = (e, items) => {
    e.preventDefault();
    e.stopPropagation();
    setState({ open: true, x: e.clientX, y: e.clientY, items });
  };
  const close = () => setState((s) => ({ ...s, open: false }));
  return { open, close, menuProps: { ...state, onClose: close } };
}

export function ContextMenu({ open, x, y, items, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    if (!open) return;
    // Clamp inside viewport
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      let nx = x, ny = y;
      if (x + r.width > window.innerWidth - 8) nx = window.innerWidth - r.width - 8;
      if (y + r.height > window.innerHeight - 8) ny = window.innerHeight - r.height - 8;
      setPos({ x: nx, y: ny });
    });
  }, [open, x, y]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[20000] min-w-[200px] acrylic-strong rounded-lg shadow-acrylic p-1 animate-scale-in"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) =>
        it.separator ? (
          <div key={`sep-${i}`} className="h-px bg-border my-1" />
        ) : (
          <button
            key={it.label + i}
            disabled={it.disabled}
            onClick={() => {
              if (it.disabled) return;
              it.onClick?.();
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm text-left transition-colors",
              it.disabled
                ? "opacity-40 cursor-not-allowed"
                : it.danger
                ? "hover:bg-destructive/15 hover:text-destructive"
                : "hover:bg-foreground/10"
            )}
          >
            {it.icon && <it.icon className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{it.label}</span>
            {it.shortcut && <span className="text-[11px] text-muted-foreground">{it.shortcut}</span>}
          </button>
        )
      )}
    </div>,
    document.body
  );
}
