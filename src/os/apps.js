import { lazy, createElement } from "react";
import { Folder, FileText, Settings as SettingsIcon, Monitor, Image as ImageIcon, Trash2, FileCode } from "lucide-react";
import FolderGlyph from "@/os/FolderGlyph";
import FileGlyph from "@/os/FileGlyph";

const TextGlyph = (props) => createElement(FileGlyph, { variant: "text", ...props });
const CodeGlyph = (props) => createElement(FileGlyph, { variant: "code", ...props });
const ImageGlyph = (props) => createElement(FileGlyph, { variant: "image", ...props });
const PdfGlyph = (props) => createElement(FileGlyph, { variant: "pdf", ...props });
const GenericGlyph = (props) => createElement(FileGlyph, { variant: "generic", ...props });

const FileExplorer = lazy(() => import("@/apps/FileExplorer"));
const Notepad = lazy(() => import("@/apps/Notepad"));
const Settings = lazy(() => import("@/apps/Settings"));
const About = lazy(() => import("@/apps/About"));
const PdfViewer = lazy(() => import("@/apps/PdfViewer"));
const Resume = lazy(() => import("@/apps/Resume"));
const DocViewer = lazy(() => import("@/apps/DocViewer"));

export const APPS = {
  files: {
    id: "files",
    name: "File Explorer",
    icon: Folder,
    color: "text-amber-400",
    component: FileExplorer,
    defaultSize: { width: 880, height: 560 },
  },
  notepad: {
    id: "notepad",
    name: "Notepad",
    icon: FileText,
    color: "text-sky-400",
    component: Notepad,
    defaultSize: { width: 680, height: 480 },
  },
  settings: {
    id: "settings",
    name: "Settings",
    icon: SettingsIcon,
    color: "text-zinc-300",
    component: Settings,
    defaultSize: { width: 800, height: 560 },
  },
  about: {
    id: "about",
    name: "This PC",
    icon: Monitor,
    color: "text-blue-400",
    component: About,
    defaultSize: { width: 560, height: 420 },
  },
  recycle: {
    id: "recycle",
    name: "Recycle Bin",
    icon: Trash2,
    color: "text-emerald-400",
    component: About,
    defaultSize: { width: 520, height: 360 },
  },
  pdfviewer: {
    id: "pdfviewer",
    name: "PDF Viewer",
    icon: FileText,
    color: "text-rose-400",
    component: PdfViewer,
    defaultSize: { width: 900, height: 680 },
  },
  resume: {
    id: "resume",
    name: "Resume",
    icon: FileText,
    color: "text-sky-400",
    component: Resume,
    defaultSize: { width: 880, height: 720 },
  },
  docviewer: {
    id: "docviewer",
    name: "Document",
    icon: FileText,
    color: "text-sky-400",
    component: DocViewer,
    defaultSize: { width: 760, height: 600 },
  },
};

export const PINNED_APPS = ["files", "notepad", "settings", "about", "recycle"];

export const DESKTOP_PINS = [
  { kind: "app", appId: "about" },
  { kind: "app", appId: "recycle" },
];

export function iconForFsNode(node) {
  if (!node) return FolderGlyph;
  if (node.type === "folder") return FolderGlyph;
  const ext = (node.ext || "").toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return ImageGlyph;
  if (["js", "ts", "jsx", "tsx", "json", "md", "html", "css", "py", "rs", "go"].includes(ext)) return CodeGlyph;
  if (["pdf"].includes(ext)) return PdfGlyph;
  if (["txt", "rtf", "doc", "docx"].includes(ext)) return TextGlyph;
  return GenericGlyph;
}

export function colorForFsNode(node) {
  // Realistic glyphs carry their own color; return empty so wrappers don't tint them.
  return "";
}
