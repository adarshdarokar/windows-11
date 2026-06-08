import { memo } from "react";
import { Monitor } from "lucide-react";

function About() {
  return (
    <div className="h-full p-8 overflow-auto scrollbar-thin">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-primary/15 grid place-items-center">
          <Monitor className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Adarsh's Portfolio</h2>
          <p className="text-sm text-muted-foreground">A modern desktop environment built with React.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-lg">
        {[
          ["Edition", "Web 11 Pro"],
          ["Version", "23H2"],
          ["Build", "22631.web"],
          ["Renderer", "React 18 + Vite"],
          ["UI", "Tailwind + Radix"],
          ["State", "Zustand"],
        ].map(([k, v]) => (
          <div key={k} className="p-3 rounded-lg bg-muted/50">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
            <div className="text-sm font-medium mt-0.5">{v}</div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground max-w-lg leading-relaxed">
        Drag windows by their title bar. Resize from the edges. Drag a window to the very top to maximize, or to the
        left/right edge to snap. Double-click desktop icons to open apps.
      </p>
    </div>
  );
}

export default memo(About);
