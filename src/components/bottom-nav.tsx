import { Link } from "@tanstack/react-router";
import { Home, CheckSquare, BookOpen, Settings } from "lucide-react";
import { fxTap } from "@/lib/feedback";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/tasks", label: "Rules", icon: CheckSquare },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-black/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => fxTap()}
            className="group flex flex-1 flex-col items-center gap-1 py-2.5 text-muted-foreground transition"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
