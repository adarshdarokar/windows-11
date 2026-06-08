import { useMemo } from "react";
import { Download, FileText } from "lucide-react";
import { useFS } from "@/os/fs";

/* ---------- Inline link detection ---------- */
function Linkified({ text }) {
  const re = /(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+|\+?\d[\d\s-]{7,}\d)/g;
  const out = [];
  let last = 0;
  let m;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    let href;
    if (/^https?:/i.test(tok)) href = tok;
    else if (tok.includes("@")) href = `mailto:${tok}`;
    else href = `tel:${tok.replace(/[\s-]/g, "")}`;
    out.push(
      <a
        key={`l-${key++}-${m.index}`}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
      >
        {tok}
      </a>
    );
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/* ---------- Content parser ---------- */
function parseDoc(text) {
  const lines = (text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length && !lines[i].trim()) i++;
  let title = null;
  if (i < lines.length) {
    title = lines[i].trim().replace(/^#+\s*/, "");
    i++;
  }

  let para = [];
  let bullets = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ") });
      para = [];
    }
  };
  const flushBullets = () => {
    if (bullets.length) {
      blocks.push({ type: "ul", items: bullets });
      bullets = [];
    }
  };
  const flush = () => {
    flushPara();
    flushBullets();
  };

  for (; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      flush();
      continue;
    }
    if (/^[─━—\-=_]{3,}$/.test(line)) {
      flush();
      continue;
    }

    // Markdown-ish header
    const hm = line.match(/^#{1,6}\s+(.*)$/);
    if (hm) {
      flush();
      blocks.push({ type: "h", text: hm[1].trim() });
      continue;
    }

    // ALL CAPS header line
    if (
      line.length <= 60 &&
      /^[A-Z0-9 &/()\-]+$/.test(line) &&
      /[A-Z]/.test(line) &&
      line === line.toUpperCase()
    ) {
      flush();
      blocks.push({ type: "h", text: line });
      continue;
    }

    // Bullets
    const bm = line.match(/^[•\u2013\u2014\-*]\s+(.*)$/);
    if (bm) {
      flushPara();
      bullets.push(bm[1]);
      continue;
    }
    const nm = line.match(/^\d+[.)]\s+(.*)$/);
    if (nm) {
      flushPara();
      bullets.push(nm[1]);
      continue;
    }

    // Key :- value  /  Key : value  (no large gap)
    if (!/\s{2,}/.test(raw)) {
      const kv = line.match(/^([A-Za-z][\w \/&+.\-]{0,28}?)\s*:[-–]?\s+(.+)$/);
      if (kv) {
        flush();
        blocks.push({ type: "kv", key: kv[1].trim(), value: kv[2].trim() });
        continue;
      }
    }

    // Two-column row (resume-style spacing)
    const cols = raw.match(/^(.+?)\s{2,}(.+)$/);
    if (cols) {
      flush();
      blocks.push({
        type: "row",
        left: cols[1].trim(),
        right: cols[2].trim(),
      });
      continue;
    }

    flushBullets();
    para.push(line);
  }
  flush();
  return { title, blocks };
}

/* ---------- Render helpers ---------- */
function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-3 mt-7 mb-3 first:mt-0">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground">
        {children}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function KeyValue({ k, v }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-1">
      <div className="sm:w-32 shrink-0 text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
        {k}
      </div>
      <div className="text-[13px] leading-relaxed text-foreground/90 min-w-0 break-words">
        <Linkified text={v} />
      </div>
    </div>
  );
}

function Row({ left, right }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-1">
      <div className="text-[13.5px] font-medium text-foreground">
        <Linkified text={left} />
      </div>
      <div className="text-[12px] text-muted-foreground">
        <Linkified text={right} />
      </div>
    </div>
  );
}

function Paragraph({ text }) {
  return (
    <p className="text-[13px] leading-relaxed text-foreground/85 my-3">
      <Linkified text={text} />
    </p>
  );
}

function BulletList({ items }) {
  return (
    <ul className="my-3 space-y-2">
      {items.map((it, idx) => (
        <li key={idx} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground/85">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span className="min-w-0">
            <Linkified text={it} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- App ---------- */
export default function DocViewer({ props }) {
  const fileId = props?.fileId || null;
  const node = useFS((s) => (fileId ? s.nodes[fileId] : null));
  const content = node?.content ?? props?.text ?? "";
  const name = node?.name || "Document";
  const downloadUrl = node?.downloadUrl;
  const downloadName = node?.downloadName || name;

  const { title, blocks } = useMemo(() => parseDoc(content), [content]);

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
            {name}
          </span>
        </div>
        {downloadUrl && (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[11.5px] font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        )}
      </div>

      {/* Document */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <article className="max-w-3xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
          {title && (
            <header className="pb-5 mb-6 border-b border-border">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            </header>
          )}

          {blocks.map((b, idx) => {
            if (b.type === "h") return <SectionHeader key={idx}>{b.text}</SectionHeader>;
            if (b.type === "kv") return <KeyValue key={idx} k={b.key} v={b.value} />;
            if (b.type === "row") return <Row key={idx} left={b.left} right={b.right} />;
            if (b.type === "ul") return <BulletList key={idx} items={b.items} />;
            return <Paragraph key={idx} text={b.text} />;
          })}
        </article>
      </div>
    </div>
  );
}
