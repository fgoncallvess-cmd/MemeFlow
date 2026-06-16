import { TrendingUp, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { TRENDING_CATEGORIES } from "@/data/mockData";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCount } from "@/lib/utils";

export default function RightSidebar() {
  const { setActiveModule } = useApp();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  const toggleFollow = (userId: string) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const entries = await Promise.all(
          TRENDING_CATEGORIES.map(async (cat) => {
            const { count, error } = await supabase
              .from("posts")
              .select("id", { count: "exact", head: true })
              .eq("category", cat.name);

            return { name: cat.name, count: error ? 0 : (count || 0) };
          })
        );

        const map: Record<string, number> = {};
        entries.forEach(e => { map[e.name] = e.count; });
        setCategoryCounts(map);
      } catch (err) {
        console.error("Error loading sidebar category counts:", err);
      }
    };

    loadCounts();
  }, []);

  return (
    <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto pb-4">
      {/* Trending Categories */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-sm text-zinc-100">Categorias em Alta</h3>
        </div>
        <div className="space-y-2">
          {TRENDING_CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveModule("explore")}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/60 transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-purple-400" dangerouslySetInnerHTML={{ __html: cat.icon }} />
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-200 group-hover:text-purple-300 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-xs text-zinc-500">{`${formatCount(categoryCounts[cat.name] ?? 0)} memes`}</p>
                </div>
              </div>
              <Badge variant="category" className="text-[10px] px-1.5 py-0.5">
                #{i + 1}
              </Badge>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Creator Suggestions - Empty State */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-sm text-zinc-100">Criadores Sugeridos</h3>
        </div>
        <div className="text-center py-6">
          <div className="text-3xl mb-2">👤</div>
          <p className="text-xs text-zinc-400">Nenhum criador sugerido no momento</p>
          <p className="text-xs text-zinc-500 mt-1">Explore criadores reais na comunidade</p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-zinc-600 px-4">
        MemeFlow © 2025 • Feito com 😂 e ☕
      </p>
    </aside>
  );
}
