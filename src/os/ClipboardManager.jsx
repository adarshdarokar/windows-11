import { useEffect } from "react";
import { useFS } from "@/os/fs";
import { useOS } from "@/os/store";
import { sounds } from "@/os/sounds";
import { toast } from "sonner";

/**
 * Global keyboard handler for clipboard ops on focused FS items.
 * Reads selection from useOS().fsSelection and current location from useOS().fsCurrentId.
 * Triggered by Ctrl/Cmd + X / C / V (when not in an input/textarea).
 */
export default function ClipboardManager() {
  const setClip = useFS((s) => s.setClipboard);
  const clip = useFS((s) => s.clipboard);
  const move = useFS((s) => s.move);
  const copyNode = useFS((s) => s.copyNode);
  const remove = useFS((s) => s.remove);
  const nodes = useFS((s) => s.nodes);

  const sel = useOS((s) => s.fsSelection);
  const cur = useOS((s) => s.fsCurrentId);
  const setFsSelection = useOS((s) => s.setFsSelection);
  const notify = useOS((s) => s.notify);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;

      const key = e.key.toLowerCase();
      if (!["x", "c", "v"].includes(key)) return;

      if ((key === "x" || key === "c") && sel?.length > 0) {
        e.preventDefault();
        setClip({ ids: sel, mode: key === "x" ? "cut" : "copy" });
        sounds.click();
        toast(key === "x" ? "Cut to clipboard" : "Copied to clipboard", {
          description: `${sel.length} item${sel.length > 1 ? "s" : ""}`,
        });
      } else if (key === "v" && clip?.ids?.length > 0 && cur) {
        e.preventDefault();
        const target = nodes[cur];
        if (!target || target.type !== "folder") return;
        const newIds = [];
        clip.ids.forEach((id) => {
          if (clip.mode === "cut") {
            move(id, cur);
            newIds.push(id);
          } else {
            const nid = copyNode(id, cur);
            if (nid) newIds.push(nid);
          }
        });
        sounds.click();
        const verb = clip.mode === "cut" ? "Moved" : "Pasted";
        toast.success(`${verb} ${newIds.length} item${newIds.length > 1 ? "s" : ""}`, {
          description: `to ${target.name}`,
        });
        notify({
          title: `${verb} ${newIds.length} item${newIds.length > 1 ? "s" : ""}`,
          body: `to ${target.name}`,
        });
        if (clip.mode === "cut") setClip(null);
        setFsSelection(newIds);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, cur, clip, nodes, setClip, move, copyNode, remove, setFsSelection, notify]);

  return null;
}
