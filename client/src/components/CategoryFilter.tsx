import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  active: string | null;
  onChange: (value: string | null) => void;

  onNearMe: () => void;
  nearActive: boolean;

  onSearchChange?: (value: string) => void;
};

const clean = (v: string | null | undefined) => (v ?? "").trim();
const keyOf = (v: string) => clean(v).toLowerCase();

export default function CategoryFilter({
  active,
  onChange,
  onNearMe,
  nearActive,
  onSearchChange,
}: Props) {
  const [searchMode, setSearchMode] = useState(false);
  const [q, setQ] = useState("");

  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadingCats(true);

      const { data } = await supabase
        .from("places")
        .select("category")
        .not("category", "is", null);

      if (cancelled) return;

      const m = new Map<string, string>();
      for (const row of (data as { category: string | null }[]) ?? []) {
        const v = clean(row.category);
        if (!v) continue;
        const k = keyOf(v);
        if (!m.has(k)) m.set(k, v);
      }

      setDbCategories(
        Array.from(m.values()).sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        )
      );
      setLoadingCats(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => dbCategories.map((c) => ({ id: c, label: c })),
    [dbCategories]
  );

  useEffect(() => {
    if (!searchMode) {
      setQ("");
      onSearchChange?.("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode]);

  return (
    <div className="glass r-lg">
      <div className="px-4 py-3">
        {!searchMode ? (
          <div className="flex items-center gap-2">
            {/* ✅ PINNED ONLY SEARCH */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setSearchMode(true)}
                className="h-9 w-9 rounded-full bg-white/10 text-white border border-white/10 flex items-center justify-center"
                title="Search"
              >
                ⌕
              </button>
            </div>

            {/* ✅ SCROLLABLE: Near me + Categories */}
            <div
              className={[
                "flex-1 min-w-0",
                "flex gap-2 items-center",
                "overflow-x-auto overflow-y-hidden whitespace-nowrap",
                "scroll-smooth",
                "[&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]",
              ].join(" ")}
            >
              {/* Near me (scrolls) */}
              <button
                type="button"
                onClick={onNearMe}
                className={[
                  "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition shrink-0",
                  "text-white",
                  nearActive ? "bg-[#E64A19] shadow" : "bg-[#FF5722]",
                ].join(" ")}
                style={
                  nearActive
                    ? { boxShadow: "0 10px 24px rgba(255,87,34,0.35)" }
                    : undefined
                }
              >
                📍 Near me
              </button>

              {/* Categories */}
              {loadingCats ? (
                <div className="text-white/60 text-sm px-2">Loading…</div>
              ) : (
                categories.map((cat) => {
                  const isActive = clean(active) === clean(cat.id);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onChange(cat.id)}
                      className={[
                        "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition shrink-0",
                        isActive
                          ? "bg-white text-black shadow"
                          : "bg-white/10 text-white border border-white/10",
                      ].join(" ")}
                      style={
                        isActive
                          ? { boxShadow: "0 12px 30px rgba(255,87,34,0.15)" }
                          : undefined
                      }
                    >
                      {cat.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full min-w-0">
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
                onSearchChange?.(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchMode(false);
              }}
              placeholder="Search places..."
              className="w-full min-w-0 h-10 px-4 rounded-full bg-white text-black font-semibold outline-none"
            />

            <button
              type="button"
              onClick={() => setSearchMode(false)}
              className="h-10 px-4 rounded-full bg-white/10 text-white border border-white/15 shrink-0"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
