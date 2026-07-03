import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandHeader } from "@/components/brand-header";
import { BottomNav } from "@/components/bottom-nav";
import { Plus, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/journal/")({
  component: JournalList,
});

function JournalList() {
  const { data: entries } = useQuery({
    queryKey: ["journal-list-full"],
    queryFn: async () => {
      const { data } = await supabase.from("journal_entries").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen pb-24">
      <BrandHeader />
      <main className="mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Journal</h2>
          <Link
            to="/journal/new"
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground glow-blue"
          >
            <Plus className="h-3.5 w-3.5" />New Entry
          </Link>
        </div>

        <div className="space-y-2">
          {(entries ?? []).map((e) => {
            const win = e.result === "Win";
            return (
              <Link
                key={e.id}
                to="/journal/$id"
                params={{ id: e.id }}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 glow-blue-soft transition active:scale-[0.99]"
              >
                <div className={`h-10 w-1 shrink-0 rounded-full ${win ? "bg-success" : e.result === "Loss" ? "bg-destructive" : "bg-muted"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{e.pair || "—"}</span>
                    <span className="text-xs text-muted-foreground">{e.direction}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{e.date} · {e.session}</div>
                </div>
                <div className="text-right">
                  <div className={`font-display text-lg font-bold ${win ? "text-success" : e.result === "Loss" ? "text-destructive" : "text-muted-foreground"}`}>
                    {Number(e.pnl_usd) >= 0 ? "+" : ""}${Number(e.pnl_usd).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{e.result || "—"}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
          {(entries ?? []).length === 0 && (
            <div className="rounded-3xl bg-card p-10 text-center text-sm text-muted-foreground glow-blue-soft">
              No entries yet. Log your first trade.
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
