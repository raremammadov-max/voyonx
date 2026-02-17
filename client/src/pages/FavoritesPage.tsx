import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

/* =====================
   HEART ICON
===================== */
function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={active ? "#FF5722" : "rgba(255,255,255,.75)"}
    >
      <path d="M12 21s-7.05-4.35-9.33-8.02C.84 10.05 1.33 6.8 3.6 5.03c2.1-1.65 5.2-1.29 7.02.66L12 7.2l1.38-1.51c1.82-1.95 4.92-2.31 7.02-.66 2.27 1.77 2.76 5.02.93 7.95C19.05 16.65 12 21 12 21z" />
    </svg>
  );
}

type FavPlace = {
  id: string;
  title: string;
  address: string | null;
  image_url: string | null;
  category: string | null;
};

export default function FavoritesPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [favPlaces, setFavPlaces] = useState<FavPlace[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) setLocation("/auth");
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    const loadFavs = async () => {
      setLoadingFavs(true);

      if (!favorites.length) {
        setFavPlaces([]);
        setLoadingFavs(false);
        return;
      }

      const { data, error } = await supabase
        .from("places")
        .select("id, title, address, image_url, category")
        .in("id", favorites);

      if (error) {
        console.error(error);
        setFavPlaces([]);
        setLoadingFavs(false);
        return;
      }

      const map = new Map((data || []).map((p: any) => [p.id, p]));
      const ordered = favorites.map((id) => map.get(id)).filter(Boolean);

      setFavPlaces(ordered as FavPlace[]);
      setLoadingFavs(false);
    };

    loadFavs();
  }, [favorites]);

  const skeletons = useMemo(
    () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass r-lg overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    ),
    []
  );

  if (isLoading || !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {skeletons}
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <div className="glass-strong r-lg p-6 mb-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Favorites</h1>
            <p className="muted mt-1">
              Your saved places ({favorites.length})
            </p>
          </div>

          <Link href="/">
            <a className="btn-orange px-5 py-3 r-md">Explore</a>
          </Link>
        </div>
      </div>

      {/* CONTENT */}
      {loadingFavs ? (
        skeletons
      ) : favPlaces.length === 0 ? (
        <div className="glass r-lg p-10 text-center">
          <div className="text-xl font-extrabold text-white">
            No favorites yet
          </div>
          <p className="muted mt-2">
            Open a place and tap ♥ to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {favPlaces.map((p) => {
              const active = isFavorite(p.id);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <Link href={`/place/${p.id}`}>
                    <a className="glass r-lg overflow-hidden block group">
                      {/* IMAGE */}
                      <div className="relative aspect-square">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5" />
                        )}

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(p.id);
                          }}
                          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/45 backdrop-blur flex items-center justify-center"
                        >
                          <HeartIcon active={active} />
                        </button>
                      </div>

                      {/* INFO */}
                      <div className="p-4">
                        <div className="font-extrabold text-white">
                          {p.title}
                        </div>
                        {p.address && (
                          <div className="muted text-sm mt-1">
                            {p.address}
                          </div>
                        )}
                        {p.category && (
                          <div className="mt-3 text-xs uppercase tracking-wide text-orange-400">
                            {p.category}
                          </div>
                        )}
                      </div>
                    </a>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
