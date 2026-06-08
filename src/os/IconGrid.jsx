import { useEffect, useRef, useState, useCallback, memo, useMemo } from "react";
import { useOS } from "@/os/store";
import { useFS } from "@/os/fs";
import { APPS, DESKTOP_PINS, iconForFsNode, colorForFsNode } from "@/os/apps";
import { ContextMenu, useContextMenu } from "@/os/ContextMenu";
import { FolderPlus, FilePlus, Trash2, Pencil, RefreshCw, FolderOpen, ClipboardPaste, Scissors, Copy as CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const IS_MOBILE = typeof window !== "undefined" && window.innerWidth < 640;
const CELL_W = IS_MOBILE ? 76 : 88;
const CELL_H = IS_MOBILE ? 92 : 104;
const ICON_W = CELL_W;
const ICON_H = CELL_H;
const PADDING = IS_MOBILE ? 8 : 12;
const TASKBAR_H = 56;
const SNAP = 8; // soft snap to keep things tidy but free-form

function clampToBounds(x, y, vw, vh) {
  const maxX = Math.max(PADDING, vw - ICON_W - PADDING);
  const maxY = Math.max(PADDING, vh - ICON_H - PADDING);
  return {
    x: Math.max(PADDING, Math.min(maxX, x)),
    y: Math.max(PADDING, Math.min(maxY, y)),
  };
}

function snapToTidy(x, y) {
  return {
    x: Math.round(x / SNAP) * SNAP,
    y: Math.round(y / SNAP) * SNAP,
  };
}

function hasCollision(id, x, y, positions) {
  return Object.entries(positions).some(([otherId, p]) => {
    if (otherId === id || !p) return false;
    return Math.abs(p.x - x) < ICON_W * 0.72 && Math.abs(p.y - y) < ICON_H * 0.72;
  });
}

function findNearestOpenPosition(id, desired, positions, grid) {
  const start = clampToBounds(desired.x, desired.y, grid.vw, grid.vh);
  if (!hasCollision(id, start.x, start.y, positions)) return start;

  const startCol = Math.max(0, Math.min(grid.cols - 1, Math.round((start.x - PADDING) / CELL_W)));
  const startRow = Math.max(0, Math.min(grid.rows - 1, Math.round((start.y - PADDING) / CELL_H)));
  const maxRadius = Math.max(grid.cols, grid.rows) + 2;

  for (let radius = 0; radius <= maxRadius; radius++) {
    for (let col = startCol - radius; col <= startCol + radius; col++) {
      for (let row = startRow - radius; row <= startRow + radius; row++) {
        if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) continue;
        if (Math.abs(col - startCol) !== radius && Math.abs(row - startRow) !== radius) continue;
        const candidate = clampToBounds(PADDING + col * CELL_W, PADDING + row * CELL_H, grid.vw, grid.vh);
        if (!hasCollision(id, candidate.x, candidate.y, positions)) return candidate;
      }
    }
  }

  return start;
}

function DesktopIcon({ id, name, Icon, colorClass, pos, selected, renaming, dropTarget, onSelect, onOpen, onContextMenu, onDragStart, onRenameSubmit, onRenameCancel, onPrimaryClick }) {
  const handleMouseDown = (e) => {
    if (e.button !== 0 || renaming) return;
    e.stopPropagation();
    onSelect(id, e.ctrlKey || e.metaKey || e.shiftKey);
    onDragStart(e, id);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!renaming) onPrimaryClick(id, e.ctrlKey || e.metaKey);
  };

  return (
    <div
      data-icon-id={id}
      className={cn(
        "group absolute flex h-[92px] w-[76px] sm:h-[104px] sm:w-[88px] select-none flex-col items-center gap-1 rounded-xl px-1 sm:px-1.5 py-1.5 sm:py-2 cursor-default transition-transform duration-150",
        dropTarget && "scale-[1.06]"
      )}
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, id)}
    >
      <div className="flex h-10 w-12 sm:h-12 sm:w-14 items-center justify-center pointer-events-none transition-transform duration-150 group-hover:scale-[1.06]">
        <Icon className={cn("h-9 w-10 sm:h-11 sm:w-12 transition-transform", colorClass)} strokeWidth={1.5} />
      </div>
      {renaming ? (
        <RenameInput initial={name} onSubmit={onRenameSubmit} onCancel={onRenameCancel} />
      ) : (
        <span
          className={cn(
            "line-clamp-2 min-h-[28px] sm:min-h-[32px] max-w-full rounded-[6px] px-1 sm:px-1.5 text-center text-[11px] sm:text-[12px] font-medium leading-tight text-white pointer-events-none",
            selected && "bg-primary/85 text-primary-foreground"
          )}
          style={selected ? undefined : { textShadow: "0 1px 2px rgba(0,0,0,0.75)" }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
const MemoDesktopIcon = memo(DesktopIcon);

function RenameInput({ initial, onSubmit, onCancel }) {
  const [v, setV] = useState(initial);
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    const dot = initial.lastIndexOf(".");
    ref.current?.setSelectionRange(0, dot > 0 ? dot : initial.length);
  }, [initial]);
  return (
    <input
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSubmit(v);
        else if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onSubmit(v)}
      className="w-full text-[12px] text-center px-1 py-0.5 rounded-sm bg-background text-foreground border border-primary outline-none"
    />
  );
}

export default function IconGrid() {
  const openApp = useOS((s) => s.openApp);
  const notify = useOS((s) => s.notify);
  const setFsSelection = useOS((s) => s.setFsSelection);
  const setFsCurrentId = useOS((s) => s.setFsCurrentId);
  const allNodes = useFS((s) => s.nodes);
  const desktopChildren = useMemo(
    () =>
      Object.values(allNodes)
        .filter((n) => n.parentId === "desktop")
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
    [allNodes]
  );
  const createFolder = useFS((s) => s.createFolder);
  const createFile = useFS((s) => s.createFile);
  const remove = useFS((s) => s.remove);
  const renameNode = useFS((s) => s.rename);
  const move = useFS((s) => s.move);
  const nodes = useFS((s) => s.nodes);
  const clipboard = useFS((s) => s.clipboard);
  const setClipboard = useFS((s) => s.setClipboard);
  const copyNode = useFS((s) => s.copyNode);

  const containerRef = useRef(null);
  const [grid, setGrid] = useState({ cols: 12, rows: 8, vw: 1200, vh: 700 });
  const [positions, setPositions] = useState({}); // id -> { x, y }
  const [selected, setSelected] = useState(new Set());
  const [renamingId, setRenamingId] = useState(null);
  const dragState = useRef(null);
  const clickStateRef = useRef({ id: null, ts: 0 });
  const suppressClickRef = useRef(false);
  const contextPointRef = useRef({ x: PADDING, y: PADDING });
  const [ghost, setGhost] = useState(null);

  const ctxBg = useContextMenu();
  const ctxItem = useContextMenu();

  // Build the unified icon list: pinned apps + FS desktop children
  const items = useMemo(() => {
    const pinned = DESKTOP_PINS.map((p) => {
      const app = APPS[p.appId];
      return {
        id: `app:${p.appId}`,
        kind: "app",
        appId: p.appId,
        name: app.name,
        Icon: app.icon,
        colorClass: app.color,
        protected: true,
      };
    });
    const fs = desktopChildren.map((n) => ({
      id: `fs:${n.id}`,
      kind: "fs",
      fsId: n.id,
      name: n.name,
      Icon: iconForFsNode(n),
      colorClass: colorForFsNode(n),
      type: n.type,
      protected: false,
    }));
    return [...pinned, ...fs];
  }, [desktopChildren]);

  // Keep existing items on-screen and auto-position only new items into tidy slots
  useEffect(() => {
    setPositions((prev) => {
      const next = {};
      let changed = false;

      items.forEach((it) => {
        const saved = prev[it.id];
        const desired = saved && typeof saved.x === "number" && typeof saved.y === "number"
          ? saved
          : { x: PADDING, y: PADDING };
        const pos = findNearestOpenPosition(it.id, desired, next, grid);
        next[it.id] = pos;
        if (!saved || saved.x !== pos.x || saved.y !== pos.y) changed = true;
      });

      Object.keys(prev).forEach((id) => {
        if (!next[id]) changed = true;
      });

      return changed ? next : prev;
    });
  }, [items, grid]);

  const tidyPositions = useCallback(() => {
    setPositions(() => {
      const next = {};
      items.forEach((it) => {
        outer: for (let col = 0; col < grid.cols; col++) {
          for (let row = 0; row < grid.rows; row++) {
            const desired = { x: PADDING + col * CELL_W, y: PADDING + row * CELL_H };
            const pos = clampToBounds(desired.x, desired.y, grid.vw, grid.vh);
            if (!hasCollision(it.id, pos.x, pos.y, next)) {
              next[it.id] = pos;
              break outer;
            }
          }
        }
      });
      return next;
    });
  }, [items, grid]);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight - TASKBAR_H;
      setGrid({
        cols: Math.max(1, Math.floor((w - PADDING * 2) / CELL_W)),
        rows: Math.max(1, Math.floor((h - PADDING * 2) / CELL_H)),
        vw: w,
        vh: h,
      });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const publishSelection = useCallback(
    (next) => {
      const fsIds = Array.from(next)
        .map((selectedId) => items.find((it) => it.id === selectedId))
        .filter((item) => item?.kind === "fs")
        .map((item) => item.fsId);
      setFsCurrentId("desktop");
      setFsSelection(fsIds);
    },
    [items, setFsCurrentId, setFsSelection]
  );

  const select = useCallback((id, additive) => {
    setSelected((prev) => {
      let next;
      if (additive) {
        next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
      } else {
        next = new Set([id]);
      }
      publishSelection(next);
      return next;
    });
  }, [publishSelection]);

  const open = useCallback(
    (id) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      if (item.kind === "app") {
        if (item.appId === "about") {
          openApp("files", {
            title: "This PC",
            size: APPS.files.defaultSize,
            allowMultiple: true,
            props: { startId: "root" },
          });
          return;
        }
        if (item.appId === "recycle") {
          openApp("files", {
            title: "Recycle Bin",
            size: APPS.files.defaultSize,
            allowMultiple: true,
            props: { startId: "recycle-bin" },
          });
          return;
        }
        const app = APPS[item.appId];
        openApp(item.appId, { title: app.name, size: app.defaultSize });
      } else {
        const node = nodes[item.fsId];
        if (!node) return;
        if (node.type === "folder") {
          openApp("files", {
            title: node.name,
            size: APPS.files.defaultSize,
            allowMultiple: true,
            props: { startId: node.id },
          });
        } else if (node.url && (node.ext || "").toLowerCase() === "pdf") {
          openApp("pdfviewer", {
            title: node.name,
            allowMultiple: true,
            size: { width: 900, height: 680 },
            props: { fileId: node.id },
          });
        } else {
          openApp(node.appId || "notepad", {
            title: node.name,
            allowMultiple: true,
            size: { width: 680, height: 480 },
            props: { fileId: node.id },
          });
        }
      }
    },
    [items, nodes, openApp]
  );

  const [dropTargetId, setDropTargetId] = useState(null);

  const clearSelection = useCallback((e) => {
    if (e.target !== containerRef.current) return;
    const next = new Set();
    setSelected(next);
    setFsCurrentId("desktop");
    setFsSelection([]);
    clickStateRef.current = { id: null, ts: 0 };
  }, [setFsCurrentId, setFsSelection]);

  const handlePrimaryClick = useCallback(
    (id, additive) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      select(id, additive);
      const nowTs = Date.now();
      const last = clickStateRef.current;
      if (last.id === id && nowTs - last.ts < 320) {
        clickStateRef.current = { id: null, ts: 0 };
        open(id);
        return;
      }
      clickStateRef.current = { id, ts: nowTs };
    },
    [open, select]
  );

  const onIconDragStart = useCallback(
    (e, id) => {
      const rect = containerRef.current.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const orig = positions[id] || { x: PADDING, y: PADDING };
      // offset between cursor and icon top-left so icon doesn't jump under the cursor
      const offX = startX - (rect.left + orig.x);
      const offY = startY - (rect.top + orig.y);
      let moved = false;
      const draggedItem = items.find((it) => it.id === id);
      dragState.current = { id, startX, startY, orig };
      suppressClickRef.current = false;

      const findFolderTargetAt = (cx, cy) => {
        if (!draggedItem || draggedItem.kind !== "fs") return null;
        const elements = document.elementsFromPoint(cx, cy);
        for (const el of elements) {
          const targetId = el.getAttribute?.("data-icon-id");
          if (!targetId || targetId === id) continue;
          const targetItem = items.find((it) => it.id === targetId);
          if (!targetItem) continue;
          if (targetItem.kind === "fs" && targetItem.type === "folder") return { mode: "folder", targetItem };
          if (targetItem.kind === "app" && targetItem.appId === "recycle") return { mode: "recycle", targetItem };
          return null;
        }
        return null;
      };

      const computeFreePos = (ev) => {
        let x = ev.clientX - rect.left - offX;
        let y = ev.clientY - rect.top - offY;
        // soft snap to a light grid for tidiness
        ({ x, y } = snapToTidy(x, y));
        return clampToBounds(x, y, grid.vw, grid.vh);
      };

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        moved = true;
        const target = findFolderTargetAt(ev.clientX, ev.clientY);
        setDropTargetId(target ? target.targetItem.id : null);
        const pos = computeFreePos(ev);
        // live update the icon position so it follows the cursor
        setPositions((prev) => ({ ...prev, [id]: pos }));
        setGhost(target ? null : { id, ...pos });
      };

      const onUp = (ev) => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        if (moved) {
          suppressClickRef.current = true;
          const target = findFolderTargetAt(ev.clientX, ev.clientY);
          if (target && draggedItem?.kind === "fs") {
            const destinationId = target.mode === "recycle" ? "recycle-bin" : target.targetItem.fsId;
            move(draggedItem.fsId, destinationId);
            const srcNode = nodes[draggedItem.fsId];
            const tgtNode = nodes[destinationId];
            if (srcNode && tgtNode) {
              toast.success(`Moved "${srcNode.name}"`, { description: `to ${tgtNode.name}` });
              notify({ title: `Moved "${srcNode.name}"`, body: `to ${tgtNode.name}` });
            }
            // restore original position; node will disappear from desktop on next render
            setPositions((prev) => ({ ...prev, [id]: orig }));
          } else {
            const finalPos = computeFreePos(ev);
            setPositions((prev) => ({ ...prev, [id]: findNearestOpenPosition(id, finalPos, prev, grid) }));
          }
        }
        setGhost(null);
        setDropTargetId(null);
        dragState.current = null;
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [positions, grid, items, move, nodes, notify]
  );

  const pasteInto = (parentId) => {
    if (!clipboard?.ids?.length) return;
    const newIds = [];
    clipboard.ids.forEach((id) => {
      if (clipboard.mode === "cut") { move(id, parentId); newIds.push(id); }
      else { const nid = copyNode(id, parentId); if (nid) newIds.push(nid); }
    });
    const verb = clipboard.mode === "cut" ? "Moved" : "Pasted";
    toast.success(`${verb} ${newIds.length} item${newIds.length > 1 ? "s" : ""}`, { description: "to Desktop" });
    notify({ title: `${verb} ${newIds.length} item${newIds.length > 1 ? "s" : ""}`, body: "to Desktop" });
    if (clipboard.mode === "cut") setClipboard(null);
  };

  const selectSet = useCallback((next) => {
    setSelected(next);
    publishSelection(next);
  }, [publishSelection]);

  const createDesktopFolder = useCallback((point) => {
    const id = createFolder("desktop", "New folder");
    const iconId = `fs:${id}`;
    const rect = containerRef.current?.getBoundingClientRect();
    const raw = rect
      ? { x: point.x - rect.left - ICON_W / 2, y: point.y - rect.top - ICON_H / 2 }
      : { x: PADDING, y: PADDING };
    const snapped = snapToTidy(raw.x, raw.y);
    setPositions((prev) => ({ ...prev, [iconId]: findNearestOpenPosition(iconId, snapped, prev, grid) }));
    setRenamingId(iconId);
    selectSet(new Set([iconId]));
  }, [createFolder, grid, selectSet]);

  const createDesktopFile = useCallback((point) => {
    const id = createFile("desktop", "New file.txt");
    const iconId = `fs:${id}`;
    const rect = containerRef.current?.getBoundingClientRect();
    const raw = rect
      ? { x: point.x - rect.left - ICON_W / 2, y: point.y - rect.top - ICON_H / 2 }
      : { x: PADDING, y: PADDING };
    const snapped = snapToTidy(raw.x, raw.y);
    setPositions((prev) => ({ ...prev, [iconId]: findNearestOpenPosition(iconId, snapped, prev, grid) }));
    setRenamingId(iconId);
    selectSet(new Set([iconId]));
  }, [createFile, grid, selectSet]);

  const deleteItem = useCallback((item) => {
    if (!item || item.kind !== "fs") return;
    const n = nodes[item.fsId];
    const wasInRecycleBin = n?.parentId === "recycle-bin";
    remove(item.fsId);
    selectSet(new Set());
    if (n) {
      toast[wasInRecycleBin ? "error" : "success"](wasInRecycleBin ? `Permanently deleted "${n.name}"` : `Moved "${n.name}" to Recycle Bin`);
      notify({
        title: wasInRecycleBin ? "Item permanently deleted" : "Moved to Recycle Bin",
        body: n.name,
        tone: wasInRecycleBin ? "destructive" : "default",
        icon: Trash2,
      });
    }
  }, [nodes, notify, remove, selectSet]);

  const handleBgContext = (e) => {
    if (e.target !== containerRef.current) return;
    contextPointRef.current = { x: e.clientX, y: e.clientY };
    const selectedItems = Array.from(selected).map((id) => items.find((i) => i.id === id)).filter(Boolean);
    const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
    const singleCanEdit = singleSelected?.kind === "fs";
    ctxBg.open(e, [
      { label: "New folder", icon: FolderPlus, onClick: () => createDesktopFolder(contextPointRef.current) },
      { label: "New text file", icon: FilePlus, onClick: () => createDesktopFile(contextPointRef.current) },
      { separator: true },
      { label: "Paste", icon: ClipboardPaste, disabled: !clipboard?.ids?.length, onClick: () => pasteInto("desktop") },
      { separator: true },
      { label: "Rename", icon: Pencil, disabled: !singleCanEdit, onClick: () => setRenamingId(singleSelected.id) },
      { label: "Delete", icon: Trash2, danger: true, disabled: selectedItems.length === 0 || selectedItems.some((it) => it.kind !== "fs"), onClick: () => selectedItems.forEach(deleteItem) },
      { separator: true },
      { label: "Open File Explorer", icon: FolderOpen, onClick: () => openApp("files", { title: "File Explorer", size: APPS.files.defaultSize, props: { startId: "desktop" } }) },
      { label: "Refresh", icon: RefreshCw, onClick: tidyPositions },
    ]);
  };

  const handleItemContext = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    selectSet(new Set([id]));
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const isProtected = item.protected;
    const isFs = item.kind === "fs";
    ctxItem.open(e, [
      { label: "Open", icon: FolderOpen, onClick: () => open(id) },
      { separator: true },
      { label: "Cut", icon: Scissors, disabled: !isFs, onClick: () => { setClipboard({ ids: [item.fsId], mode: "cut" }); toast("Cut to clipboard"); } },
      { label: "Copy", icon: CopyIcon, disabled: !isFs, onClick: () => { setClipboard({ ids: [item.fsId], mode: "copy" }); toast("Copied to clipboard"); } },
      { label: "Paste", icon: ClipboardPaste, disabled: !clipboard?.ids?.length || item.type !== "folder", onClick: () => pasteInto(item.fsId) },
      { separator: true },
      { label: "Rename", icon: Pencil, disabled: isProtected, onClick: () => setRenamingId(id) },
      { label: "Delete", icon: Trash2, danger: true, disabled: isProtected, onClick: () => deleteItem(item) },
    ]);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={clearSelection}
      onContextMenu={handleBgContext}
      className="absolute inset-0"
      style={{ height: `calc(100vh - ${TASKBAR_H}px)` }}
    >
      {items.map((it) => {
        const pos = positions[it.id];
        if (!pos) return null;
        return (
          <MemoDesktopIcon
            key={it.id}
            id={it.id}
            name={it.name}
            Icon={it.Icon}
            colorClass={it.colorClass}
            pos={pos}
            selected={selected.has(it.id)}
            renaming={renamingId === it.id}
            dropTarget={dropTargetId === it.id}
            onSelect={select}
            onPrimaryClick={handlePrimaryClick}
            onOpen={open}
            onContextMenu={handleItemContext}
            onDragStart={onIconDragStart}
            onRenameSubmit={(name) => {
              if (it.kind === "fs") renameNode(it.fsId, name);
              setRenamingId(null);
            }}
            onRenameCancel={() => setRenamingId(null)}
          />
        );
      })}
      {ghost && (
        <div
          className="absolute w-[88px] h-[92px] rounded-md border-2 border-primary/60 bg-primary/10 pointer-events-none"
          style={{ left: ghost.x, top: ghost.y }}
        />
      )}

      <ContextMenu {...ctxBg.menuProps} />
      <ContextMenu {...ctxItem.menuProps} />
    </div>
  );
}
