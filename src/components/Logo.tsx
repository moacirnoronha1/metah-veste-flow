import logoAsset from "@/assets/metah-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Metah Veste"
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}
