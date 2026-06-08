import { useEffect, useRef, useState } from "react";
import {
  Wifi,
  Bluetooth,
  Plane,
  BatteryCharging,
  Moon,
  Accessibility,
  Sun,
  Volume2,
  Settings as Cog,
  BatteryFull,
  Airplay,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOS } from "@/os/store";

/* ---------- macOS Control Center–style square tile ---------- */

function Tile({ icon: Icon, label, sub, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-2 text-center mac-tile",
        active && "mac-tile-active"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 grid place-items-center rounded-full transition-colors",
          active ? "bg-white/25 text-white" : "bg-foreground/10 text-foreground/85"
        )}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
      </div>
      <div className="leading-tight">
        <div className="text-[11.5px] font-semibold truncate">{label}</div>
        {sub && (
          <div className={cn("text-[10px] truncate", active ? "text-white/80" : "text-muted-foreground")}>
            {sub}
          </div>
        )}
      </div>
    </button>
  );
}

function SliderRow({ icon: Icon, label, value, onChange }) {
  return (
    <div>
      <div className="mb-1.5 text-[11.5px] font-semibold text-foreground/80">{label}</div>
      <div className="relative flex items-center">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mac-range"
        />
        <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
          <Icon className="w-3.5 h-3.5 text-foreground/55" />
        </div>
      </div>
    </div>
  );
}

const PANEL_WIDTH = 340;
const TASKBAR_GAP = 12;
const EDGE_MARGIN = 8;

export default function QuickSettings({ open, onClose, anchorRef }) {
  const panelRef = useRef(null);
  const theme = useOS((s) => s.theme);
  const toggleTheme = useOS((s) => s.toggleTheme);
  const openApp = useOS((s) => s.openApp);
  const brightness = useOS((s) => s.brightness);
  const setBrightness = useOS((s) => s.setBrightness);
  const volume = useOS((s) => s.volume);
  const setVolume = useOS((s) => s.setVolume);

  const [wifi, setWifi] = useState(true);
  const [bt, setBt] = useState(false);
  const [airdrop, setAirdrop] = useState(false);
  const [plane, setPlane] = useState(false);
  const [saver, setSaver] = useState(false);
  const [a11y, setA11y] = useState(false);

  const [pos, setPos] = useState({ left: 0, bottom: 60 });

  useEffect(() => {
    if (!open) return;
    const compute = () => {
      const anchor = anchorRef?.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(PANEL_WIDTH, vw - EDGE_MARGIN * 2);
      if (!anchor) {
        setPos({ left: vw - width - EDGE_MARGIN, bottom: 60 });
        return;
      }
      const r = anchor.getBoundingClientRect();
      const anchorCenter = r.left + r.width / 2;
      let left = anchorCenter - width / 2;
      left = Math.max(EDGE_MARGIN, Math.min(left, vw - width - EDGE_MARGIN));
      const bottom = Math.max(EDGE_MARGIN, vh - r.top + TASKBAR_GAP);
      setPos({ left, bottom });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      style={{
        left: pos.left,
        bottom: pos.bottom,
        width: `min(${PANEL_WIDTH}px, calc(100vw - ${EDGE_MARGIN * 2}px))`,
        backgroundImage:
          "linear-gradient(180deg, hsl(var(--wp-h, 220) var(--wp-s, 30%) 95% / 0.55), hsl(var(--wp-h, 220) var(--wp-s, 30%) 92% / 0.4))",
      }}
      className="fixed z-[10001] rounded-[20px] mac-glass p-5 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 transition-[background-image] duration-500"
    >
      <div className="flex flex-col gap-4">
        {/* 3x3 toggle grid */}
        <div className="grid grid-cols-3 gap-3">
          <Tile icon={Wifi} label="Wi-Fi" sub={wifi ? "realme" : "Off"} active={wifi} onClick={() => setWifi((v) => !v)} />
          <Tile icon={Bluetooth} label="Bluetooth" sub={bt ? "On" : "Off"} active={bt} onClick={() => setBt((v) => !v)} />
          <Tile icon={Airplay} label="AirDrop" sub={airdrop ? "On" : "Off"} active={airdrop} onClick={() => setAirdrop((v) => !v)} />
          <Tile icon={Plane} label="Airplane" sub={plane ? "On" : "Off"} active={plane} onClick={() => setPlane((v) => !v)} />
          <Tile
            icon={theme === "dark" ? Sun : Moon}
            label={theme === "dark" ? "Light" : "Dark"}
            sub="Mode"
            active={theme === "dark"}
            onClick={toggleTheme}
          />
          <Tile icon={BatteryCharging} label="Low Power" sub={saver ? "On" : "Off"} active={saver} onClick={() => setSaver((v) => !v)} />
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-3">
          <SliderRow icon={Sun} label="Display" value={brightness} onChange={setBrightness} />
          <SliderRow icon={Volume2} label="Sound" value={volume} onChange={setVolume} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[12px] text-foreground/80">
            <BatteryFull className="w-4 h-4 text-emerald-500" />
            <span className="font-medium">87%</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setA11y((v) => !v)}
              className="h-7 w-7 grid place-items-center rounded-full hover:bg-foreground/10 transition-colors"
              aria-label="Accessibility"
            >
              <Accessibility className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                openApp("settings", { title: "Settings" });
                onClose();
              }}
              className="h-7 w-7 grid place-items-center rounded-full hover:bg-foreground/10 transition-colors"
              aria-label="All settings"
            >
              <Cog className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
