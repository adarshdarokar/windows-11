import { create } from "zustand";
import { persist } from "zustand/middleware";

let nextId = 1;
const newId = () => `w-${nextId++}`;

const DEFAULT_SIZE = { width: 720, height: 480 };
const MIN_SIZE = { width: 320, height: 220 };

const center = (size) => ({
  x: Math.max(40, Math.round((window.innerWidth - size.width) / 2)),
  y: Math.max(40, Math.round((window.innerHeight - size.height - 60) / 2)),
});

export const ACCENTS = {
  blue:   { h: 212, s: 95, l: 50, glowL: 65 },
  violet: { h: 262, s: 83, l: 58, glowL: 70 },
  pink:   { h: 330, s: 85, l: 60, glowL: 72 },
  emerald:{ h: 158, s: 70, l: 45, glowL: 58 },
  amber:  { h: 35,  s: 95, l: 55, glowL: 68 },
  red:    { h: 0,   s: 80, l: 56, glowL: 68 },
};

export function applyAccent(name) {
  const a = ACCENTS[name] || ACCENTS.blue;
  const root = document.documentElement;
  root.style.setProperty("--primary", `${a.h} ${a.s}% ${a.l}%`);
  root.style.setProperty("--primary-glow", `${a.h} 100% ${a.glowL}%`);
  root.style.setProperty("--ring", `${a.h} ${a.s}% ${a.l}%`);
  root.style.setProperty("--accent", `${a.h} ${a.s}% ${a.l}%`);
}

export const useOS = create(
  persist(
    (set, get) => ({
  theme: "dark",
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    set({ theme: next });
    queueMicrotask(() => get().notify?.({ title: `Switched to ${next} mode` }));
  },

  startOpen: false,
  setStartOpen: (v) => set({ startOpen: v }),
  toggleStart: () => set((s) => ({ startOpen: !s.startOpen, notifOpen: false })),

  /* Lock / login (session-only, not persisted) */
  locked: true,
  signedIn: false,
  unlock: () => set({ locked: false }),
  signIn: () => set({ locked: false, signedIn: true }),
  lock: () => set({ locked: true, signedIn: false, startOpen: false, notifOpen: false }),

  windows: [],
  activeId: null,
  zCounter: 10,

  openApp: (appId, opts = {}) => {
    const existing = get().windows.find((w) => w.appId === appId && !opts.allowMultiple);
    if (existing) {
      get().focusWindow(existing.id);
      if (existing.minimized) get().restoreWindow(existing.id);
      return existing.id;
    }
    const size = opts.size || DEFAULT_SIZE;
    const id = newId();
    const z = get().zCounter + 1;
    const pos = opts.pos || center(size);
    const offset = (get().windows.length % 6) * 24;
    set((s) => ({
      windows: [
        ...s.windows,
        {
          id, appId,
          title: opts.title || appId,
          icon: opts.icon || null,
          x: pos.x + offset, y: pos.y + offset,
          width: size.width, height: size.height,
          z, minimized: false, maximized: false,
          snap: null, prev: null,
          props: opts.props || {},
        },
      ],
      activeId: id, zCounter: z, startOpen: false,
    }));
    return id;
  },

  closeWindow: (id) =>
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id);
      const top = [...remaining].filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
      return { windows: remaining, activeId: top ? top.id : null };
    }),

  focusWindow: (id) =>
    set((s) => {
      if (s.activeId === id && s.windows.find((w) => w.id === id)?.z === s.zCounter) return s;
      const z = s.zCounter + 1;
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
        zCounter: z, activeId: id,
      };
    }),

  minimizeWindow: (id) =>
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id && !w.minimized);
      const top = [...remaining].sort((a, b) => b.z - a.z)[0];
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
        activeId: top ? top.id : null,
      };
    }),

  toggleMinimize: (id) => {
    const w = get().windows.find((x) => x.id === id);
    if (!w) return;
    if (w.minimized || get().activeId !== id) get().focusWindow(id);
    else get().minimizeWindow(id);
  },

  restoreWindow: (id) => get().focusWindow(id),

  toggleMaximize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized) {
          const p = w.prev || { x: 80, y: 60, width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height };
          return { ...w, maximized: false, snap: null, ...p, prev: null };
        }
        return { ...w, prev: { x: w.x, y: w.y, width: w.width, height: w.height }, maximized: true, snap: null };
      }),
    })),

  snapWindow: (id, side) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.snap === side) return w;
        const prev = w.prev || { x: w.x, y: w.y, width: w.width, height: w.height };
        return { ...w, snap: side, maximized: false, prev };
      }),
    })),

  unsnap: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id || !w.snap) return w;
        const p = w.prev || { x: 100, y: 80, width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height };
        return { ...w, snap: null, ...p, prev: null };
      }),
    })),

  updateWindowGeometry: (id, geom) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...geom } : w)),
    })),

  setWindowProps: (id, patch) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, props: { ...w.props, ...patch } } : w
      ),
    })),

  /* Wallpaper */
  wallpaper: "mountains",
  setWallpaper: (w) => {
    set({ wallpaper: w });
    queueMicrotask(() => get().notify?.({ title: "Wallpaper changed" }));
  },

  /* System brightness (0-100) and volume (0-100) */
  brightness: 100,
  volume: 60,
  setBrightness: (v) => set({ brightness: Math.max(10, Math.min(100, v)) }),
  setVolume: (v) => {
    const vol = Math.max(0, Math.min(100, v));
    try { localStorage.setItem("win11-volume", String(vol)); } catch {}
    try { localStorage.setItem("win11-mute", vol === 0 ? "1" : "0"); } catch {}
    set({ volume: vol });
  },

  /* Accent */
  accent: "blue",
  setAccent: (name) => {
    applyAccent(name);
    set({ accent: name });
    queueMicrotask(() => get().notify?.({ title: "Accent color updated", body: name }));
  },

  /* FS bridge: focused selection + current folder, used by ClipboardManager */
  fsSelection: [],
  fsCurrentId: "desktop",
  setFsSelection: (ids) => {
    const cur = get().fsSelection;
    const a = ids || [];
    if (cur.length === a.length && cur.every((v, i) => v === a[i])) return;
    set({ fsSelection: a });
  },
  setFsCurrentId: (id) => {
    if (get().fsCurrentId === id) return;
    set({ fsCurrentId: id });
  },

  /* Notifications */
  notifications: [],
  notifOpen: false,
  setNotifOpen: (v) => set({ notifOpen: v, startOpen: false }),
  toggleNotif: () => set((s) => ({ notifOpen: !s.notifOpen, startOpen: false })),
  notify: ({ title, body, tone = "default", icon } = {}) => {
    if (!title) return;
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({
      notifications: [{ id, title, body, tone, icon, ts: Date.now() }, ...s.notifications].slice(0, 50),
    }));
  },
  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),
}),
    {
      name: "win11-os-v1",
      partialize: (s) => ({ theme: s.theme, wallpaper: s.wallpaper, accent: s.accent, brightness: s.brightness, volume: s.volume }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        document.documentElement.classList.toggle("dark", state.theme === "dark");
        applyAccent(state.accent);
      },
    }
  )
);

export { MIN_SIZE };
