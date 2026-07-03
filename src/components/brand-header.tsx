import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import wolfAsset from "@/assets/wolf-logo.asset.json";

export function BrandHeader({ subtitle, right }: { subtitle?: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black ring-1 ring-primary/40">
          <img src={wolfAsset.url} alt="Alpha Life" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold leading-tight">Alpha Life</h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {subtitle ?? "Lead the Pack"}
          </p>
        </div>
        {right ?? (
          <Link
            to="/settings"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:text-primary"
          >
            <Settings className="h-5 w-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
