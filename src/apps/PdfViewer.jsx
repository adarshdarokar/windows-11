import { ExternalLink, Download } from "lucide-react";
import { useFS } from "@/os/fs";

export default function PdfViewer({ props }) {
  const fileId = props?.fileId;
  const node = useFS((s) => (fileId ? s.nodes[fileId] : null));
  const url = node?.url || props?.url;
  const name = node?.name || props?.name || "document.pdf";

  const absoluteUrl =
    url && typeof window !== "undefined"
      ? new URL(url, window.location.origin).href
      : url;

  const handleOpenNewTab = (e) => {
    e.preventDefault();
    if (!absoluteUrl) return;
    // Create a transient anchor and click it from a user gesture.
    // Using an absolute, same-origin URL avoids Chrome's "blocked" page
    // that appears when a sandboxed preview iframe opens a relative URL.
    const a = document.createElement("a");
    a.href = absoluteUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!url) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        No PDF to display.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-10 items-center gap-2 border-b border-border/60 bg-muted/40 px-3 text-xs">
        <span className="truncate font-medium">{name}</span>
        <div className="ml-auto flex items-center gap-1">
          <a
            href={absoluteUrl}
            download={name}
            className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-foreground/10"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-foreground/10"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in new tab
          </button>
        </div>
      </div>
      <object
        data={`${url}#toolbar=1&view=FitH`}
        type="application/pdf"
        className="flex-1 w-full bg-white"
      >
        <iframe
          src={`${url}#toolbar=1&view=FitH`}
          title={name}
          className="h-full w-full border-0 bg-white"
        />
      </object>
    </div>
  );
}
