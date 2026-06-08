import { useEffect, useState, useCallback, useRef } from "react";
import { Download } from "lucide-react";
import { useFS } from "@/os/fs";

function NotepadInner({ winId, props }) {
  const fileId = props?.fileId || null;
  const nodeName = useFS((s) => (fileId ? s.nodes[fileId]?.name : null));
  const fileContent = useFS((s) => (fileId ? s.nodes[fileId]?.content : null));
  const downloadUrl = useFS((s) => (fileId ? s.nodes[fileId]?.downloadUrl : null));
  const downloadName = useFS((s) => (fileId ? s.nodes[fileId]?.downloadName : null));
  const readOnly = useFS((s) => (fileId ? !!s.nodes[fileId]?.readOnly : false));
  const writeFile = useFS((s) => s.writeFile);

  const [text, setText] = useState(fileContent ?? props?.text ?? "");
  const loadedRef = useRef(fileId);

  useEffect(() => {
    if (fileId && loadedRef.current !== fileId) {
      loadedRef.current = fileId;
      setText(fileContent || "");
    }
  }, [fileId, fileContent]);

  const onChange = useCallback(
    (e) => {
      const v = e.target.value;
      setText(v);
      if (fileId && !readOnly) writeFile(fileId, v);
    },
    [fileId, writeFile, readOnly]
  );

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Detect clickable links (URLs, emails, phones, social handles).
  const links = (() => {
    const out = [];
    const seen = new Set();
    const push = (label, href) => {
      if (seen.has(href)) return;
      seen.add(href);
      out.push({ label, href });
    };

    // Capture full URLs first and remember which handles they cover.
    const urls = text.match(/\bhttps?:\/\/[^\s)]+/g) || [];
    const coveredGh = new Set();
    const coveredLi = new Set();
    urls.forEach((u) => {
      push(u, u);
      const gh = u.match(/github\.com\/([A-Za-z0-9_-]+)/i);
      if (gh) coveredGh.add(gh[1].toLowerCase());
      const li = u.match(/linkedin\.com\/(?:in|pub)\/([A-Za-z0-9_-]+)/i);
      if (li) coveredLi.add(li[1].toLowerCase());
    });

    // github :- handle  (also "gh", "git hub")
    const ghRe = /\b(?:github|gh)\s*[:\-–]+\s*@?([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))/gi;
    let m;
    while ((m = ghRe.exec(text))) {
      const handle = m[1].replace(/^https?$/i, "");
      if (!handle || coveredGh.has(handle.toLowerCase())) continue;
      push(`github.com/${handle}`, `https://github.com/${handle}`);
    }

    // linkedin :- handle
    const liRe = /\blinked\s*in\s*[:\-–]+\s*@?([A-Za-z0-9_-]{2,100})/gi;
    while ((m = liRe.exec(text))) {
      const handle = m[1].replace(/^https?$/i, "");
      if (!handle || coveredLi.has(handle.toLowerCase())) continue;
      push(`linkedin.com/in/${handle}`, `https://www.linkedin.com/in/${handle}`);
    }

    (text.match(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g) || []).forEach((e) =>
      push(e, `mailto:${e}`)
    );
    (text.match(/(?:\+?\d[\d\s-]{7,}\d)/g) || []).forEach((p) =>
      push(p.trim(), `tel:${p.replace(/[\s-]/g, "")}`)
    );
    return out;
  })();

  return (
    <div className="h-full flex flex-col">
      <div className="h-9 px-3 flex items-center gap-3 border-b border-border text-xs text-muted-foreground">
        <span className="hover:text-foreground cursor-default">File</span>
        <span className="hover:text-foreground cursor-default">Edit</span>
        <span className="hover:text-foreground cursor-default">View</span>
        {readOnly && (
          <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] uppercase tracking-wide">Read-only</span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {downloadUrl && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(downloadUrl);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = downloadName || nodeName || "download";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (err) {
                  window.open(downloadUrl, "_blank");
                }
              }}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/15 text-primary hover:bg-primary/25 text-[11px] font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download Resume
            </button>
          )}
          {nodeName && <span className="text-[11px]">Saved · {nodeName}</span>}
        </div>
      </div>
      {links.length > 0 && (
        <div className="px-3 py-1.5 flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 text-[11px]">
          <span className="text-muted-foreground">Links:</span>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate max-w-[240px]"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
      <textarea
        value={text}
        onChange={onChange}
        placeholder="Start typing…"
        spellCheck={false}
        readOnly={readOnly}
        className="flex-1 w-full p-4 outline-none resize-none bg-transparent text-sm leading-6 font-mono scrollbar-thin"
      />
      <div className="h-7 px-3 flex items-center justify-between border-t border-border text-[11px] text-muted-foreground">
        <span>Ln 1, Col {text.length + 1}</span>
        <span>{wordCount} words · {text.length} chars</span>
      </div>
    </div>
  );
}

export default NotepadInner;
