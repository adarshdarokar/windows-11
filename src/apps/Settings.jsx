import { memo, useState } from "react";
import { useOS, ACCENTS } from "@/os/store";
import { Sun, Moon, Monitor, Image as ImageIcon, Info, Palette, Volume2, VolumeX, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { setMuted, isMuted } from "@/os/sounds";
import { WALLPAPERS } from "@/os/wallpapers";

const SECTIONS = [
  { id: "personalization", label: "Personalization", icon: Palette },
  { id: "system", label: "System", icon: Monitor },
  { id: "about", label: "About", icon: Info },
];

function Settings() {
  const theme = useOS((s) => s.theme);
  const toggleTheme = useOS((s) => s.toggleTheme);
  const wallpaper = useOS((s) => s.wallpaper);
  const setWallpaper = useOS((s) => s.setWallpaper);
  const accent = useOS((s) => s.accent);
  const setAccent = useOS((s) => s.setAccent);
  const [section, setSection] = useState("personalization");
  const [mutedState, setMutedState] = useState(isMuted());

  return (
    <div className="h-full flex">
      <div className="w-52 border-r border-border p-3 shrink-0">
        <div className="mb-4 px-2 text-xs text-muted-foreground">Settings</div>
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className={cn(
              "w-full flex items-center gap-2 h-9 px-2 rounded-md text-sm transition-colors text-left",
              section === item.id ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-foreground/8"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-auto scrollbar-thin">
        {section === "personalization" && (
          <>
            <h2 className="text-xl font-semibold mb-1">Personalization</h2>
            <p className="text-sm text-muted-foreground mb-6">Customize how your desktop looks and feels.</p>

            <Section icon={theme === "dark" ? Moon : Sun} title="Color mode">
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {["light", "dark"].map((t) => (
                  <button
                    key={t}
                    onClick={() => theme !== t && toggleTheme()}
                    className={cn(
                      "rounded-lg p-3 border-2 transition-all text-left",
                      theme === t ? "border-primary" : "border-border hover:border-foreground/30"
                    )}
                  >
                    <div className={cn("h-16 rounded-md mb-2", t === "dark"
                      ? "bg-gradient-to-br from-slate-900 to-slate-800"
                      : "bg-gradient-to-br from-slate-100 to-slate-200")}
                    />
                    <div className="text-sm font-medium capitalize">{t}</div>
                  </button>
                ))}
              </div>
            </Section>

            <Section icon={Palette} title="Accent color">
              <div className="flex flex-wrap gap-3">
                {Object.entries(ACCENTS).map(([name, a]) => {
                  const active = accent === name;
                  return (
                    <button
                      key={name}
                      onClick={() => setAccent(name)}
                      className={cn(
                        "w-11 h-11 rounded-lg grid place-items-center transition-all hover:scale-105 active:scale-95",
                        active ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : "ring-1 ring-border"
                      )}
                      style={{ background: `hsl(${a.h} ${a.s}% ${a.l}%)` }}
                      aria-label={name}
                      title={name}
                    >
                      {active && <Check className="w-4 h-4 text-primary-foreground" />}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section icon={ImageIcon} title="Wallpaper">
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 p-1">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWallpaper(w.id)}
                    className={cn(
                      "rounded-xl overflow-hidden border-2 transition-all text-left bg-muted/30",
                      wallpaper === w.id ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-foreground/40"
                    )}
                  >
                    <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${w.src})` }} />
                    <div className="text-sm font-medium px-3 py-3">{w.label}</div>
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {section === "system" && (
          <>
            <h2 className="text-xl font-semibold mb-1">System</h2>
            <p className="text-sm text-muted-foreground mb-6">Sound and behavior.</p>
            <Section icon={mutedState ? VolumeX : Volume2} title="UI sounds">
              <button
                onClick={() => { const v = !mutedState; setMuted(v); setMutedState(v); }}
                className="flex items-center justify-between w-full max-w-sm h-12 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm">Play subtle sounds when opening apps</span>
                <div className={cn(
                  "w-10 h-6 rounded-full relative transition-colors",
                  mutedState ? "bg-muted-foreground/30" : "bg-primary"
                )}>
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow",
                    mutedState ? "left-0.5" : "left-[18px]"
                  )} />
                </div>
              </button>
            </Section>
          </>
        )}

        {section === "about" && (
          <>
            <h2 className="text-xl font-semibold mb-1">About</h2>
            <p className="text-sm text-muted-foreground mb-6">System information.</p>
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {[
                ["Edition", "Web 11 Pro"],
                ["Version", "23H2"],
                ["Renderer", "React 18 + Vite"],
                ["State", "Zustand (persisted)"],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-lg bg-muted/50">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
                  <div className="text-sm font-medium mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {title}
      </h3>
      {children}
    </div>
  );
}

export default memo(Settings);
