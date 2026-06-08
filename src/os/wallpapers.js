import wallpaperMountains from "@/assets/wallpaper-mountains.jpg";
import wallpaperMacSonoma from "@/assets/wallpaper-mac-sonoma.jpg";
import wallpaperMacBigSur from "@/assets/wallpaper-mac-bigsur.jpg";
import wallpaperMacVentura from "@/assets/wallpaper-mac-ventura.jpg";
import wallpaperWin11Bloom from "@/assets/wallpaper-win11-bloom.jpg";
import wallpaperWin11Glow from "@/assets/wallpaper-win11-glow.jpg";
import wallpaperWin11Light from "@/assets/wallpaper-win11-light.jpg";
import wallpaperDark from "@/assets/wallpaper.jpg";
import wallpaperLight from "@/assets/wallpaper-light.jpg";
import wallpaperSunset from "@/assets/wallpaper-sunset.jpg";
import wallpaperBloomBlue from "@/assets/wallpaper-bloom-blue.jpg";
import wallpaperEmeraldFlow from "@/assets/wallpaper-emerald-flow.jpg";
import wallpaperPetalPink from "@/assets/wallpaper-petal-pink.jpg";
import wallpaperAuroraNight from "@/assets/wallpaper-aurora-night.jpg";
import wallpaperPeachGlow from "@/assets/wallpaper-peach-glow.jpg";
import wallpaperMagentaRibbon from "@/assets/wallpaper-magenta-ribbon.jpg";
import wallpaperCyanMist from "@/assets/wallpaper-cyan-mist.jpg";
import wallpaperMountainDawn from "@/assets/wallpaper-mountain-dawn.jpg";
import wallpaperCrystalBlue from "@/assets/wallpaper-crystal-blue.jpg";
import wallpaperPastelMesh from "@/assets/wallpaper-pastel-mesh.jpg";
import wallpaperTealSpiral from "@/assets/wallpaper-teal-spiral.jpg";
import wallpaperAmberWave from "@/assets/wallpaper-amber-wave.jpg";

export const WALLPAPERS = [
  { id: "mountains", label: "Alpine Glow", src: wallpaperMountains },
  { id: "mac-sonoma", label: "macOS Sonoma", src: wallpaperMacSonoma },
  { id: "mac-bigsur", label: "macOS Big Sur", src: wallpaperMacBigSur },
  { id: "mac-ventura", label: "macOS Ventura", src: wallpaperMacVentura },
  { id: "win11-bloom", label: "Windows 11 Bloom", src: wallpaperWin11Bloom },
  { id: "win11-glow", label: "Windows 11 Glow", src: wallpaperWin11Glow },
  { id: "win11-light", label: "Windows 11 Light", src: wallpaperWin11Light },
  { id: "dark", label: "Coral Vista", src: wallpaperDark },
  { id: "light", label: "Bloom Light", src: wallpaperLight },
  { id: "sunset", label: "Sunset Horizon", src: wallpaperSunset },
  { id: "bloom-blue", label: "Azure Glass", src: wallpaperBloomBlue },
  { id: "emerald-flow", label: "Emerald Flow", src: wallpaperEmeraldFlow },
  { id: "petal-pink", label: "Petal Pink", src: wallpaperPetalPink },
  { id: "aurora-night", label: "Aurora Night", src: wallpaperAuroraNight },
  { id: "peach-glow", label: "Peach Glow", src: wallpaperPeachGlow },
  { id: "magenta-ribbon", label: "Magenta Ribbon", src: wallpaperMagentaRibbon },
  { id: "cyan-mist", label: "Cyan Mist", src: wallpaperCyanMist },
  { id: "mountain-dawn", label: "Mountain Dawn", src: wallpaperMountainDawn },
  { id: "crystal-blue", label: "Crystal Blue", src: wallpaperCrystalBlue },
  { id: "pastel-mesh", label: "Pastel Mesh", src: wallpaperPastelMesh },
  { id: "teal-spiral", label: "Teal Spiral", src: wallpaperTealSpiral },
  { id: "amber-wave", label: "Amber Wave", src: wallpaperAmberWave },
];

export function getWallpaperById(id) {
  return WALLPAPERS.find((wallpaper) => wallpaper.id === id) || WALLPAPERS[0];
}
