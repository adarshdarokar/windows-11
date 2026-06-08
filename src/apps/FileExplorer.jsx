import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BriefcaseBusiness,
  ChevronRight,
  ClipboardPaste,
  Copy as CopyIcon,
  Download,
  FileCode,
  FilePlus,
  FileText,
  FolderOpen,
  FolderPlus,
  GraduationCap,
  Home,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  List,
  Mail,
  Monitor,
  Pencil,
  RefreshCw,
  Scissors,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFS } from "@/os/fs";
import { useOS } from "@/os/store";
import { ContextMenu, useContextMenu } from "@/os/ContextMenu";
import FolderGlyph from "@/os/FolderGlyph";
import FileGlyph from "@/os/FileGlyph";
import { toast } from "sonner";

const QUICK_ACCESS = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "pictures", label: "Pictures", icon: ImageIcon },
  { id: "downloads", label: "Downloads", icon: Download },
];

const SECTION_META = {
  Projects: { icon: BriefcaseBusiness, blurb: "Selected work, case studies, and product builds" },
  Skills: { icon: Sparkles, blurb: "Tooling, frontend systems, and technical strengths" },
  Experience: { icon: Target, blurb: "Roles, wins, and delivery highlights" },
  Education: { icon: GraduationCap, blurb: "Academic background and qualifications" },
  About: { icon: UserRound, blurb: "Profile, values, and current focus" },
  Contact: { icon: Mail, blurb: "Ways to connect and current availability" },
};

const SECTION_ORDER = ["Projects", "Skills", "Experience", "Education", "About", "Contact"];

const TextFileGlyph = (props) => <FileGlyph variant="text" {...props} />;
const CodeFileGlyph = (props) => <FileGlyph variant="code" {...props} />;
const ImageFileGlyph = (props) => <FileGlyph variant="image" {...props} />;
const PdfFileGlyph = (props) => <FileGlyph variant="pdf" {...props} />;
const GenericFileGlyph = (props) => <FileGlyph variant="generic" {...props} />;

function iconFor(node) {
  if (node.type === "folder") return FolderGlyph;
  const ext = (node.ext || "").toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return ImageFileGlyph;
  if (["js", "ts", "jsx", "tsx", "json", "md", "html", "css", "py"].includes(ext)) return CodeFileGlyph;
  if (ext === "pdf") return PdfFileGlyph;
  if (["txt", "rtf", "doc", "docx"].includes(ext)) return TextFileGlyph;
  return GenericFileGlyph;
}

function typeLabel(node) {
  if (node.type === "folder") return "Folder";
  const ext = (node.ext || "txt").toUpperCase();
  return `${ext} File`;
}

function selectionEquals(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

function FileExplorer({ winId, props }) {
  const startId = props?.startId || "desktop";
  const openApp = useOS((s) => s.openApp);
  const setFsSelection = useOS((s) => s.setFsSelection);
  const setFsCurrentId = useOS((s) => s.setFsCurrentId);
  const activeId = useOS((s) => s.activeId);
  const notify = useOS((s) => s.notify);

  const nodes = useFS((s) => s.nodes);
  const createFolder = useFS((s) => s.createFolder);
  const createFile = useFS((s) => s.createFile);
  const remove = useFS((s) => s.remove);
  const rename = useFS((s) => s.rename);
  const move = useFS((s) => s.move);
  const search = useFS((s) => s.search);
  const clipboard = useFS((s) => s.clipboard);
  const setClipboard = useFS((s) => s.setClipboard);
  const copyNode = useFS((s) => s.copyNode);

  const [history, setHistory] = useState([startId]);
  const [hIdx, setHIdx] = useState(0);
  const currentId = history[hIdx] || startId;
  const current = nodes[currentId] || nodes.desktop || nodes.root;

  const [view, setView] = useState("grid");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [renamingId, setRenamingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const ctx = useContextMenu();
  const ctxItem = useContextMenu();

  const navigate = useCallback(
    (id) => {
      if (!nodes[id] || nodes[id].type !== "folder") return;
      setHistory((prev) => {
        const next = [...prev.slice(0, hIdx + 1), id];
        return next;
      });
      setHIdx((prev) => Math.min(prev + 1, hIdx + 1));
      setSelected((prev) => (prev.size ? new Set() : prev));
      setQuery("");
      setRenamingId(null);
    },
    [hIdx, nodes]
  );

  useEffect(() => {
    if (!nodes[currentId] || nodes[currentId].type !== "folder") {
      setHistory([startId]);
      setHIdx(0);
    }
  }, [currentId, nodes, startId]);

  const isWindowActive = activeId === winId;
  const selectionKey = useMemo(() => Array.from(selected).sort().join("|"), [selected]);
  const lastPublishedRef = useRef({ active: false, currentId: null, selectionKey: "" });

  useEffect(() => {
    if (!isWindowActive) return;
    const last = lastPublishedRef.current;
    if (last.currentId === currentId && last.selectionKey === selectionKey && last.active) return;
    lastPublishedRef.current = { active: true, currentId, selectionKey };
    setFsCurrentId(currentId);
    setFsSelection(selectionKey ? selectionKey.split("|") : []);
  }, [currentId, isWindowActive, selectionKey, setFsCurrentId, setFsSelection]);

  const allItems = useMemo(() => {
    if (query.trim()) return search(query, currentId);
    return Object.values(nodes)
      .filter((n) => n.parentId === currentId)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [currentId, nodes, query, search]);

  const folderChildren = useMemo(() => {
    const counts = {};
    Object.values(nodes).forEach((node) => {
      if (!node.parentId) return;
      counts[node.parentId] = (counts[node.parentId] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  const path = useMemo(() => {
    const out = [];
    let cur = nodes[currentId];
    while (cur) {
      out.unshift(cur);
      cur = cur.parentId ? nodes[cur.parentId] : null;
    }
    return out;
  }, [currentId, nodes]);

  const desktopFolders = useMemo(() => {
    const order = new Map(SECTION_ORDER.map((name, index) => [name, index]));
    return Object.values(nodes)
      .filter((n) => n.parentId === "desktop" && n.type === "folder")
      .sort((a, b) => {
        const ai = order.has(a.name) ? order.get(a.name) : 999;
        const bi = order.has(b.name) ? order.get(b.name) : 999;
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
  }, [nodes]);

  const grouped = useMemo(
    () => ({
      folders: allItems.filter((item) => item.type === "folder"),
      files: allItems.filter((item) => item.type === "file"),
    }),
    [allItems]
  );

  const selectedNode = useMemo(() => {
    if (selected.size !== 1) return null;
    const [id] = Array.from(selected);
    return nodes[id] || null;
  }, [nodes, selected]);

  const portfolioLinks = useMemo(
    () =>
      desktopFolders.map((node) => ({
        node,
        icon: SECTION_META[node.name]?.icon || FolderOpen,
        blurb: SECTION_META[node.name]?.blurb || "Portfolio section",
      })),
    [desktopFolders]
  );

  const goBack = () => {
    if (hIdx <= 0) return;
    setHIdx((prev) => prev - 1);
    setSelected(new Set());
    setQuery("");
  };
  const goFwd = () => {
    if (hIdx >= history.length - 1) return;
    setHIdx((prev) => prev + 1);
    setSelected(new Set());
    setQuery("");
  };
  const goUp = () => current?.parentId && navigate(current.parentId);

  const openItem = (node) => {
    if (node.type === "folder") {
      navigate(node.id);
      return;
    }
    if (node.url && (node.ext || "").toLowerCase() === "pdf") {
      openApp("pdfviewer", {
        title: node.name,
        allowMultiple: true,
        size: { width: 900, height: 680 },
        props: { fileId: node.id },
      });
      return;
    }
    openApp(node.appId || "notepad", {
      title: node.name,
      allowMultiple: true,
      size: { width: 680, height: 480 },
      props: { fileId: node.id },
    });
  };

  const updateSelection = useCallback((nodeId, additive = false) => {
    setSelected((prev) => {
      const next = additive ? new Set(prev) : new Set();
      if (additive && next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return selectionEquals(prev, next) ? prev : next;
    });
  }, []);

  const handleCut = (ids) => {
    setClipboard({ ids, mode: "cut" });
    toast("Cut to clipboard", { description: `${ids.length} item${ids.length > 1 ? "s" : ""}` });
  };

  const handleCopy = (ids) => {
    setClipboard({ ids, mode: "copy" });
    toast("Copied to clipboard", { description: `${ids.length} item${ids.length > 1 ? "s" : ""}` });
  };

  const handlePaste = (targetId) => {
    if (!clipboard?.ids?.length) return;
    const target = nodes[targetId];
    if (!target || target.type !== "folder") return;
    const newIds = [];
    clipboard.ids.forEach((id) => {
      if (clipboard.mode === "cut") {
        move(id, targetId);
        newIds.push(id);
      } else {
        const nid = copyNode(id, targetId);
        if (nid) newIds.push(nid);
      }
    });
    const verb = clipboard.mode === "cut" ? "Moved" : "Pasted";
    toast.success(`${verb} ${newIds.length} item${newIds.length > 1 ? "s" : ""}`, { description: `to ${target.name}` });
    notify({ title: `${verb} ${newIds.length} item${newIds.length > 1 ? "s" : ""}`, body: `to ${target.name}` });
    if (clipboard.mode === "cut") setClipboard(null);
    setSelected(new Set(newIds));
  };

  const handleDelete = (id) => {
    const node = nodes[id];
    const wasInRecycleBin = node?.parentId === "recycle-bin";
    remove(id);
    setSelected((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (node) {
      toast[wasInRecycleBin ? "error" : "success"](
        wasInRecycleBin ? `Permanently deleted "${node.name}"` : `Moved "${node.name}" to Recycle Bin`
      );
      notify({
        title: wasInRecycleBin ? "Item permanently deleted" : "Moved to Recycle Bin",
        body: node.name,
        tone: wasInRecycleBin ? "destructive" : "default",
        icon: Trash2,
      });
    }
  };

  const onDragStart = (e, node) => {
    updateSelection(node.id);
    e.dataTransfer.setData("text/x-fs-id", node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropOn = (e, folderId) => {
    e.preventDefault();
    setDragOverId(null);
    const id = e.dataTransfer.getData("text/x-fs-id");
    if (id && id !== folderId) {
      move(id, folderId);
      const from = nodes[id];
      const target = nodes[folderId];
      if (from && target) notify({ title: `Moved "${from.name}"`, body: `to ${target.name}` });
    }
  };

  const openBgMenu = (e) => {
    setSelected(new Set());
    ctx.open(e, [
      {
        label: "New folder",
        icon: FolderPlus,
        onClick: () => {
          const id = createFolder(currentId, "New folder");
          setRenamingId(id);
          setSelected(new Set([id]));
        },
      },
      {
        label: "New text file",
        icon: FilePlus,
        onClick: () => {
          const id = createFile(currentId, "New file.txt");
          setRenamingId(id);
          setSelected(new Set([id]));
        },
      },
      { separator: true },
      { label: "Paste", icon: ClipboardPaste, disabled: !clipboard?.ids?.length, onClick: () => handlePaste(currentId) },
      { separator: true },
      { label: "Refresh", icon: RefreshCw, onClick: () => setQuery("") },
    ]);
  };

  const openItemMenu = (e, node) => {
    updateSelection(node.id);
    const isProtected = node.id === "desktop" || node.id === "root";
    ctxItem.open(e, [
      { label: "Open", icon: FolderOpen, onClick: () => openItem(node) },
      { separator: true },
      { label: "Cut", icon: Scissors, disabled: isProtected, onClick: () => handleCut([node.id]) },
      { label: "Copy", icon: CopyIcon, disabled: isProtected, onClick: () => handleCopy([node.id]) },
      { label: "Paste", icon: ClipboardPaste, disabled: !clipboard?.ids?.length || node.type !== "folder", onClick: () => handlePaste(node.id) },
      { separator: true },
      { label: "Rename", icon: Pencil, disabled: isProtected, onClick: () => setRenamingId(node.id) },
      { label: "Delete", icon: Trash2, danger: true, disabled: isProtected, onClick: () => handleDelete(node.id) },
    ]);
  };

  return (
    <div className="flex h-full flex-col bg-background/95" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex h-12 items-center gap-2 sm:gap-3 border-b border-border/60 bg-gradient-to-b from-background to-background/70 px-2 sm:px-4 backdrop-blur overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={goBack} disabled={hIdx === 0} ariaLabel="Go back">
            <ArrowLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={goFwd} disabled={hIdx >= history.length - 1} ariaLabel="Go forward">
            <ArrowRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={goUp} disabled={!current?.parentId} ariaLabel="Go up">
            <ArrowUp className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="h-5 w-px bg-border/60" aria-hidden="true" />

        <div className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 text-sm">
          <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
          {path.map((part, index) => (
            <div key={part.id} className="flex min-w-0 items-center">
              {index > 0 && <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />}
              <button
                onClick={() => navigate(part.id)}
                className="truncate rounded-full px-2 py-1 font-medium leading-none hover:bg-foreground/10"
              >
                {part.name}
              </button>
            </div>
          ))}
        </div>

        <div className="hidden md:flex h-9 w-64 items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 text-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70"
            placeholder={`Search ${current?.name || "files"}`}
          />
        </div>

        <div className="h-5 w-px bg-border/60" aria-hidden="true" />

        <div className="flex rounded-full border border-border/60 bg-muted/40 p-1">
          <button
            onClick={() => setView("grid")}
            className={cn("grid h-7 w-7 place-items-center rounded-full transition-colors", view === "grid" ? "bg-background shadow-sm" : "hover:bg-foreground/10")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("grid h-7 w-7 place-items-center rounded-full transition-colors", view === "list" ? "bg-background shadow-sm" : "hover:bg-foreground/10")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>


      <div className="flex min-h-0 flex-1">
        <aside className="hidden sm:flex w-[180px] md:w-[220px] xl:w-[248px] shrink-0 flex-col overflow-y-auto border-r border-border/60 bg-gradient-to-b from-muted/40 to-muted/10 px-2 md:px-3 py-4 md:py-5 scrollbar-thin">
          <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Portfolio</div>
          <div className="flex flex-col gap-1 pb-4">
            {portfolioLinks.map(({ node, icon }) => (
              <SidebarButton
                key={node.id}
                label={node.name}
                icon={icon}
                active={currentId === node.id}
                onClick={() => navigate(node.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverId(node.id);
                }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => onDropOn(e, node.id)}
                dragOver={dragOverId === node.id}
              />
            ))}
          </div>
        </aside>

        {/* Mobile portfolio quick-nav (replaces sidebar on small screens) */}


        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          onClick={() => setSelected(new Set())}
          onContextMenu={openBgMenu}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDropOn(e, currentId)}
        >
          {/* Mobile portfolio quick-nav (replaces sidebar on small screens) */}
          <div className="sm:hidden flex gap-1.5 overflow-x-auto border-b border-border/60 bg-muted/20 px-3 py-2 scrollbar-thin">
            {portfolioLinks.map(({ node, icon: Icon }) => {
              const active = currentId === node.id;
              return (
                <button
                  key={node.id}
                  onClick={(e) => { e.stopPropagation(); navigate(node.id); }}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                    active ? "border-primary/40 bg-primary/15 text-foreground" : "border-border/60 bg-background/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {node.name}
                </button>
              );
            })}
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden flex items-center gap-2 border-b border-border/60 bg-background/60 px-3 py-2">
            <div className="flex h-9 flex-1 items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 text-sm">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70"
                placeholder={`Search ${current?.name || "files"}`}
              />
            </div>
          </div>

          <div className="border-b border-border/60 px-4 sm:px-6 py-3 sm:py-5">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {query.trim() ? "Search results" : currentId === "desktop" ? "Workspace" : "Folder"}
                </div>
                <h2 className="mt-1 sm:mt-1.5 truncate text-lg sm:text-2xl font-semibold leading-tight tracking-tight">{query.trim() ? `Results for “${query}”` : current?.name}</h2>
                <p className="mt-1 sm:mt-1.5 text-[12px] sm:text-[13px] leading-relaxed text-muted-foreground">
                  {query.trim()
                    ? `${allItems.length} matching item${allItems.length === 1 ? "" : "s"}`
                    : `${grouped.folders.length} folder${grouped.folders.length === 1 ? "" : "s"} · ${grouped.files.length} file${grouped.files.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 md:flex">
                <ActionButton onClick={() => handlePaste(currentId)} disabled={!clipboard?.ids?.length}>
                  <ClipboardPaste className="h-4 w-4" /> Paste
                </ActionButton>
                <ActionButton onClick={() => { const id = createFolder(currentId, "New folder"); setRenamingId(id); setSelected(new Set([id])); }}>
                  <FolderPlus className="h-4 w-4" /> Folder
                </ActionButton>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-3 sm:px-6 py-3 sm:py-6 scrollbar-thin">

            {allItems.length === 0 ? (
              <div className="grid min-h-[260px] place-items-center text-center text-sm text-muted-foreground">
                {query.trim() ? "No matching items" : "This folder is empty"}
              </div>
            ) : view === "grid" ? (
              <div className="space-y-6 sm:space-y-8">
                {grouped.folders.length > 0 && (
                  <SectionBlock title={currentId === "desktop" && !query.trim() ? "Portfolio sections" : "Folders"}>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(136px,1fr))] gap-x-2 sm:gap-x-3 gap-y-4 sm:gap-y-5 justify-items-center">

                      {grouped.folders.map((node) => (
                        <ItemTile
                          key={node.id}
                          node={node}
                          selected={selected.has(node.id)}
                          renaming={renamingId === node.id}
                          subtitle={`${folderChildren[node.id] || 0} item${folderChildren[node.id] === 1 ? "" : "s"}`}
                          onSelect={(e) => {
                            e.stopPropagation();
                            updateSelection(node.id, e.ctrlKey || e.metaKey);
                          }}
                          onOpen={() => openItem(node)}
                          onContextMenu={(e) => openItemMenu(e, node)}
                          onDragStart={(e) => onDragStart(e, node)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverId(node.id);
                          }}
                          onDragLeave={() => setDragOverId(null)}
                          onDrop={(e) => onDropOn(e, node.id)}
                          dragOver={dragOverId === node.id}
                          onRenameSubmit={(name) => {
                            rename(node.id, name);
                            setRenamingId(null);
                          }}
                          onRenameCancel={() => setRenamingId(null)}
                        />
                      ))}
                    </div>
                  </SectionBlock>
                )}

                {grouped.files.length > 0 && (
                  <SectionBlock title="Files">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(136px,1fr))] gap-x-2 sm:gap-x-3 gap-y-4 sm:gap-y-5 justify-items-center">
                      {grouped.files.map((node) => (
                        <ItemTile
                          key={node.id}
                          node={node}
                          selected={selected.has(node.id)}
                          renaming={renamingId === node.id}
                          subtitle={typeLabel(node)}
                          onSelect={(e) => {
                            e.stopPropagation();
                            updateSelection(node.id, e.ctrlKey || e.metaKey);
                          }}
                          onOpen={() => openItem(node)}
                          onContextMenu={(e) => openItemMenu(e, node)}
                          onDragStart={(e) => onDragStart(e, node)}
                          onDragOver={(e) => {
                            if (node.type === "folder") {
                              e.preventDefault();
                              setDragOverId(node.id);
                            }
                          }}
                          onDragLeave={() => setDragOverId(null)}
                          onDrop={(e) => node.type === "folder" && onDropOn(e, node.id)}
                          dragOver={dragOverId === node.id}
                          onRenameSubmit={(name) => {
                            rename(node.id, name);
                            setRenamingId(null);
                          }}
                          onRenameCancel={() => setRenamingId(null)}
                        />
                      ))}
                    </div>
                  </SectionBlock>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/60 bg-card/60">
                <div className="hidden sm:grid grid-cols-[1.2fr,140px,120px] border-b border-border/60 bg-muted/30 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <span>Name</span>
                  <span>Modified</span>
                  <span>Type</span>
                </div>
                {allItems.map((node) => {
                  const Icon = iconFor(node);
                  return (
                    <div
                      key={node.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, node)}
                      onDragOver={(e) => {
                        if (node.type === "folder") {
                          e.preventDefault();
                          setDragOverId(node.id);
                        }
                      }}
                      onDragLeave={() => setDragOverId(null)}
                      onDrop={(e) => node.type === "folder" && onDropOn(e, node.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSelection(node.id, e.ctrlKey || e.metaKey);
                      }}
                      onDoubleClick={() => openItem(node)}
                      onContextMenu={(e) => openItemMenu(e, node)}
                      className={cn(
                        "grid grid-cols-[1fr,auto] sm:grid-cols-[1.2fr,140px,120px] items-center gap-2 sm:gap-3 border-b border-border/40 px-3 sm:px-5 py-2.5 sm:py-3 text-sm transition-colors last:border-b-0",
                        selected.has(node.id) ? "bg-primary/15" : "hover:bg-foreground/8",
                        dragOverId === node.id && "bg-primary/10 ring-1 ring-inset ring-primary/40"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Icon className={cn(node.type === "folder" ? "h-8 w-9 sm:h-9 sm:w-11" : "h-5 w-5", node.type !== "folder" && "text-primary")} />
                        <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
                      </span>
                      <span className="hidden sm:block text-xs text-muted-foreground">{new Date(node.updatedAt).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground sm:block">{typeLabel(node)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex h-9 items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-3 sm:px-6 text-[11px] tracking-wide text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="font-medium text-foreground/80">{allItems.length}</span>
              item{allItems.length === 1 ? "" : "s"}
              {selected.size > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span><span className="font-medium text-foreground/80">{selected.size}</span> selected</span>
                </>
              )}
            </span>
            <span className="truncate">{query.trim() ? `Searching in ${current?.name}` : current?.name}</span>
          </div>

        </div>

        <aside className="hidden w-[280px] shrink-0 border-l border-border/60 bg-muted/20 xl:flex xl:flex-col">
          <div className="border-b border-border/60 px-5 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Details</div>
            <div className="mt-1.5 truncate text-lg font-semibold leading-tight">{selectedNode?.name || current?.name}</div>
            <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{selectedNode ? typeLabel(selectedNode) : "Current location"}</div>
          </div>
          <div className="flex-1 space-y-4 overflow-auto px-5 py-5 scrollbar-thin">
            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
              <div className="mb-4 flex items-center gap-3">
                {selectedNode ? (
                  (() => {
                    const Icon = iconFor(selectedNode);
                    return <Icon className={cn(selectedNode.type === "folder" ? "h-14 w-16" : "h-8 w-8 text-primary")} />;
                  })()
                ) : (
                  <FolderOpen className="h-8 w-8 text-primary" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold leading-tight">{selectedNode?.name || current?.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedNode ? typeLabel(selectedNode) : `${allItems.length} total item${allItems.length === 1 ? "" : "s"}`}
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 border-t border-border/50 pt-3 text-[13px] text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span>Modified</span>
                  <span className="font-medium text-foreground">{new Date((selectedNode || current)?.updatedAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Children</span>
                  <span className="font-medium text-foreground">{selectedNode?.type === "folder" ? folderChildren[selectedNode.id] || 0 : folderChildren[currentId] || 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Star className="h-4 w-4 text-primary" /> Smooth actions
              </div>
              <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
                <li>Double-click to open items</li>
                <li>Right-click for rename, copy, paste, and delete</li>
                <li>Drag folders or files into another folder</li>
                <li>Ctrl/Cmd + C, X, V works on selected items</li>
              </ul>
            </div>

            {!query.trim() && currentId === "desktop" && (
              <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Info className="h-4 w-4 text-primary" /> Portfolio map
                </div>
                <div className="space-y-1 text-[13px] text-muted-foreground">
                  {portfolioLinks.map(({ node, blurb }) => (
                    <button
                      key={node.id}
                      onClick={() => navigate(node.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-foreground/8"
                    >
                      <span className="font-medium text-foreground/90">{node.name}</span>
                      <span className="truncate text-xs">{blurb}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </aside>
      </div>

      <ContextMenu {...ctx.menuProps} />
      <ContextMenu {...ctxItem.menuProps} />
    </div>
  );
}

function ToolbarButton({ children, onClick, disabled, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="grid h-8 w-8 place-items-center rounded-md border border-transparent transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function ActionButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3.5 text-[13px] font-medium transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function SidebarButton({ label, subtitle, icon: Icon, active, dragOver, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        active ? "bg-primary/14 text-foreground" : "hover:bg-foreground/8",
        dragOver && "bg-primary/10 ring-1 ring-inset ring-primary/40"
      )}
    >
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md transition-colors", active ? "bg-primary/16 text-primary" : "bg-background/70 text-muted-foreground")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold leading-snug">{label}</div>
        {subtitle && <div className="mt-0.5 truncate text-[11.5px] leading-snug text-muted-foreground">{subtitle}</div>}
      </div>
    </button>
  );
}

function SectionBlock({ title, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>{title}</span>
        <span className="h-px flex-1 bg-border/50" />
      </div>
      {children}
    </section>
  );
}


function ItemTile({
  node,
  selected,
  renaming,
  subtitle,
  onSelect,
  onOpen,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOver,
  onRenameSubmit,
  onRenameCancel,
}) {
  const Icon = iconFor(node);

  const isFolder = node.type === "folder";

  return (
    <div
      draggable={!renaming}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onSelect}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      className={cn(
        "group flex h-[120px] w-[100px] sm:h-[140px] sm:w-[124px] cursor-default select-none flex-col items-center justify-start gap-2 sm:gap-2.5 rounded-2xl px-1.5 sm:px-2 py-2.5 sm:py-3 text-center transition-transform duration-200",
        dragOver && "scale-[1.04]"
      )}
    >
      <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-[1.06]">
        <Icon
          className={cn(
            isFolder ? "h-11 w-11 sm:h-14 sm:w-14" : "h-7 w-7 sm:h-9 sm:w-9",
            !isFolder && "text-primary"
          )}
        />
      </div>
      <div className="flex w-full min-w-0 flex-col items-center justify-center gap-1">
        {renaming ? (
          <RenameInput initial={node.name} onSubmit={onRenameSubmit} onCancel={onRenameCancel} />
        ) : (
          <>
            <div className={cn(
              "line-clamp-2 break-words rounded-[5px] px-1.5 text-[12.5px] font-medium leading-snug",
              selected && "bg-primary/85 text-primary-foreground"
            )}>{node.name}</div>
            <div className="truncate text-[10.5px] leading-tight text-muted-foreground max-w-full">{subtitle}</div>
          </>
        )}
      </div>
    </div>
  );
}


function RenameInput({ initial, onSubmit, onCancel }) {
  const [value, setValue] = useState(initial);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    const dot = initial.lastIndexOf(".");
    ref.current?.setSelectionRange(0, dot > 0 ? dot : initial.length);
  }, [initial]);

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSubmit(value);
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onSubmit(value)}
      className="w-full rounded-md border border-primary bg-background px-2 py-1 text-sm outline-none"
    />
  );
}

export default FileExplorer;
