import { useEffect, useState } from "react";
import { useOS } from "@/os/store";
import { Lock, ArrowRight, Wifi, BatteryFull, Volume2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWallpaperById } from "@/os/wallpapers";

/**
 * Win11-style lock + login screen.
 * Stages:
 *  - 'lock'  : full wallpaper + clock; click / press any key to dismiss
 *  - 'login' : avatar + enter button (no password)
 *  - exits   : signIn() in store, Index fades the desktop in
 */
export default function LockScreen() {
  const locked = useOS((s) => s.locked);
  const signedIn = useOS((s) => s.signedIn);
  const unlock = useOS((s) => s.unlock);
  const signIn = useOS((s) => s.signIn);
  const wallpaper = useOS((s) => s.wallpaper);
  const wp = getWallpaperById(wallpaper).src;

  const [now, setNow] = useState(new Date());
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  // Allow any key/click on the lock surface to advance to login
  useEffect(() => {
    if (!locked) return;
    const onKey = (e) => {
      if (e.key === "Tab") return;
      unlock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, unlock]);

  if (!locked && signedIn) return null;

  const handleSignIn = (e) => {
    e?.preventDefault?.();
    setExiting(true);
    setTimeout(() => signIn(), 320);
  };

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div
      className={cn(
        "fixed inset-0 z-[20000] overflow-hidden",
        exiting ? "animate-lock-fade-out" : "animate-fade-in"
      )}
      aria-label={locked ? "Lock screen" : "Sign in"}
    >
      {/* Wallpaper (with mild blur on login) */}
      <div
        className={cn(
          "absolute inset-0 bg-cover bg-center transition-all duration-700",
          !locked && "scale-105 blur-lg brightness-50"
        )}
        style={{ backgroundImage: `url(${wp})` }}
        aria-hidden
      />
      {/* Dimmer */}
      <div className="absolute inset-0 bg-black/30" aria-hidden />

      {locked ? (
        <button
          type="button"
          onClick={unlock}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="text-white text-[7rem] md:text-[9rem] font-extralight leading-none tracking-tight drop-shadow-[0_4px_32px_rgba(0,0,0,0.6)]">
            {time}
          </div>
          <div className="text-white/80 text-xl md:text-2xl mt-3 font-light tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            {date}
          </div>
          <div className="absolute bottom-12 text-white/60 text-sm flex items-center gap-2.5 animate-pulse font-light">
            <Lock className="w-3.5 h-3.5" /> Press any key or click to sign in
          </div>
        </button>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="flex flex-col items-center animate-scale-in">
            {/* Acrylic login card */}
            <div className="flex flex-col items-center px-10 py-10 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.12)]">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] ring-[3px] ring-white/15">
                <User className="w-12 h-12" strokeWidth={1.5} />
              </div>

              {/* Welcome text */}
              <div className="mt-6 text-[1.65rem] font-light tracking-tight text-center">
                Welcome to Adarsh&apos;s Portfolio
              </div>

              {/* Username */}
              <div className="mt-1.5 text-sm text-white/60 font-light tracking-wide">
                Adarsh Darokar
              </div>

              {/* Enter button */}
              <button
                type="button"
                onClick={handleSignIn}
                className="mt-7 h-10 px-7 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 hover:border-white/40 backdrop-blur-md transition-all duration-200 flex items-center gap-2.5 text-sm font-medium shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.4)] active:scale-[0.98]"
              >
                <span>Enter Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom tray */}
          <div className="absolute bottom-6 right-8 flex items-center gap-3.5 text-white/70">
            <Wifi className="w-4 h-4" />
            <Volume2 className="w-4 h-4" />
            <BatteryFull className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
}
