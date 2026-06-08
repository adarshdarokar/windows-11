import { useEffect, useRef, useState } from "react";
import { useOS } from "@/os/store";
import IconGrid from "@/os/IconGrid";
import WindowManager from "@/os/WindowManager";
import Taskbar from "@/os/Taskbar";
import LockScreen from "@/os/LockScreen";
import NotificationCenter from "@/os/NotificationCenter";
import ClipboardManager from "@/os/ClipboardManager";
import { getWallpaperById } from "@/os/wallpapers";

// Module-level cache + reusable canvas to keep wallpaper tint sampling cheap
const tintCache = new Map<string, { h: number; s: number; l: number }>();
let sharedCanvas: HTMLCanvasElement | null = null;
const SAMPLE_SIZE = 16;

const Index = () => {
  const wallpaper = useOS((s) => s.wallpaper);
  const theme = useOS((s) => s.theme);
  const signedIn = useOS((s) => s.signedIn);
  const brightness = useOS((s) => s.brightness);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const wp = getWallpaperById(wallpaper).src;

  // Sample dominant color of wallpaper to drive adaptive UI tint
  const [tint, setTint] = useState<{ h: number; s: number; l: number } | null>(null);
  const sampleTimerRef = useRef<number | null>(null);
  useEffect(() => {
    // Cache hit — no sampling needed
    const cached = tintCache.get(wp);
    if (cached) {
      setTint(cached);
      return;
    }

    let cancelled = false;
    // Throttle: defer sampling so rapid wallpaper changes don't queue work
    if (sampleTimerRef.current) window.clearTimeout(sampleTimerRef.current);
    sampleTimerRef.current = window.setTimeout(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.src = wp;
      const sample = () => {
        if (cancelled) return;
        try {
          if (!sharedCanvas) {
            sharedCanvas = document.createElement("canvas");
            sharedCanvas.width = SAMPLE_SIZE;
            sharedCanvas.height = SAMPLE_SIZE;
          }
          const ctx = sharedCanvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          ctx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
          ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
          const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
          }
          r /= n; g /= n; b /= n;
          const rn = r / 255, gn = g / 255, bn = b / 255;
          const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
          let hh = 0, ss = 0; const ll = (max + min) / 2;
          if (max !== min) {
            const d = max - min;
            ss = ll > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case rn: hh = (gn - bn) / d + (gn < bn ? 6 : 0); break;
              case gn: hh = (bn - rn) / d + 2; break;
              case bn: hh = (rn - gn) / d + 4; break;
            }
            hh *= 60;
          }
          const out = { h: Math.round(hh), s: Math.round(ss * 100), l: Math.round(ll * 100) };
          tintCache.set(wp, out);
          if (!cancelled) setTint(out);
        } catch {
          if (!cancelled) setTint(null);
        }
      };
      if (img.complete) sample();
      else img.onload = sample;
    }, 120);

    return () => {
      cancelled = true;
      if (sampleTimerRef.current) window.clearTimeout(sampleTimerRef.current);
    };
  }, [wp]);

  useEffect(() => {
    const root = document.documentElement;
    if (tint) {
      root.style.setProperty("--wp-h", String(tint.h));
      root.style.setProperty("--wp-s", `${Math.min(60, tint.s)}%`);
      root.style.setProperty("--wp-l", `${tint.l}%`);
      root.style.setProperty("--wp-is-dark", tint.l < 50 ? "1" : "0");
    }
  }, [tint]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <h1 className="sr-only">Windows 11 style desktop environment</h1>

      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
        style={{ backgroundImage: `url(${wp})` }}
        aria-hidden
      />

      {/* Desktop layers — only mount once signed in for a smooth fade-in */}
      {signedIn && (
        <div key="desktop" className="absolute inset-0 animate-desktop-in">
          <IconGrid />
          <WindowManager />
          <Taskbar />
          <NotificationCenter />
          <ClipboardManager />
        </div>
      )}

      {/* Brightness overlay — sits above desktop, below lockscreen interactions */}
      <div
        className="pointer-events-none absolute inset-0 z-[9000] bg-black transition-opacity duration-200"
        style={{ opacity: Math.max(0, (100 - (brightness ?? 100)) / 100) * 0.55 }}
        aria-hidden
      />

      <LockScreen />
    </main>
  );
};

export default Index;
