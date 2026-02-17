import { useEffect, useMemo, useState } from "react";
import { useRoute as useWouterRoute } from "wouter";
import { supabase } from "@/lib/supabase";
import PlaceSkeleton from "@/components/PlaceSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/hooks/useFavorites";
import { useRoute } from "@/hooks/useRoute";

/* =====================
   SVG HEARTS
===================== */
function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill={active ? "#FF5722" : "#9CA3AF"} // orange / gray
      aria-hidden="true"
    >
      <path
        d="M12 21s-7.05-4.35-9.33-8.02C.84 10.05 1.33 6.9 3.6 5.1
           5.62 3.5 8.49 3.82 10.2 5.63L12 7.55l1.8-1.92
           C15.51 3.82 18.38 3.5 20.4 5.1c2.27 1.8 2.76 4.95.93 7.88
           C19.05 16.65 12 21 12 21z"
      />
    </svg>
  );
}

function MiniHeart({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M12 21s-7.05-4.35-9.33-8.02C.84 10.05 1.33 6.9 3.6 5.1
           5.62 3.5 8.49 3.82 10.2 5.63L12 7.55l1.8-1.92
           C15.51 3.82 18.38 3.5 20.4 5.1c2.27 1.8 2.76 4.95.93 7.88
           C19.05 16.65 12 21 12 21z"
      />
    </svg>
  );
}

/* =====================
   PARTICLES (BURST)
===================== */
type Particle = {
  id: number;
  dx: number;
  dy: number;
  size: number;
  rot: number;
  delay: number;
};

function makeParticles(count = 10): Particle[] {
  const parts: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 18 + Math.random() * 14; // 18..32 px
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    const size = 10 + Math.random() * 6; // 10..16
    const rot = (Math.random() * 180 - 90) | 0;
    const delay = Math.random() * 0.06; // 0..60ms
    parts.push({ id: i, dx, dy, size, rot, delay });
  }
  return parts;
}

type Place = {
  id: string;
  title: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
};

export default function PlacePage() {
  // ✅ твой роут: /place/:id
  const [, params] = useWouterRoute("/place/:id");
  const placeId = params?.id;

  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToRoute, removeFromRoute, isInRoute } = useRoute();

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  // burst state
  const [burstKey, setBurstKey] = useState(0);
  const particles = useMemo(() => makeParticles(10), [burstKey]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!placeId) {
        setPlace(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("id", placeId)
        // ✅ вместо single() — чтобы не было 406 и норм обработать null
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Ошибка загрузки места:", error);
        setPlace(null);
      } else {
        setPlace((data as Place) ?? null);
      }

      setLoading(false);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  if (loading) return <PlaceSkeleton />;

  if (!place) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="glass r-lg p-8 text-center text-white">
          <div className="text-xl font-extrabold">Локация не найдена</div>
          <div className="muted mt-2">
            Проверь ссылку или попробуй другое место.
          </div>
        </div>
      </div>
    );
  }

  const openBolt = () => {
    const url = `https://bolt.eu/ride/?lat=${place.latitude}&lng=${place.longitude}`;
    window.open(url, "_blank");
  };

  const fav = isFavorite(place.id);
  const inRoute = isInRoute(place.id);

  const onFavClick = () => {
    const willBeFavorite = !fav;

    toggleFavorite(place.id);

    if (willBeFavorite) {
      setBurstKey((k) => k + 1);
    }
  };

  const onRouteClick = async () => {
    if (inRoute) {
      await removeFromRoute(place.id);
    } else {
      await addToRoute(place.id);
    }
  };

  return (
    <motion.div
      className="mx-auto max-w-3xl px-4 py-6"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="glass r-lg overflow-hidden">
        {place.image_url && (
          <img
            src={place.image_url}
            alt={place.title}
            className="w-full h-72 object-cover"
          />
        )}

        <div className="p-6 space-y-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-extrabold leading-tight">
              {place.title}
            </h1>

            {/* FAVORITE BUTTON (BURST) */}
            <button
              type="button"
              onClick={onFavClick}
              title={fav ? "Убрать из избранного" : "Добавить в избранное"}
              aria-label="favorite"
              className="
                btn-glass focus-ring
                h-11 w-11 rounded-full
                flex items-center justify-center
                shrink-0 relative
                overflow-visible
              "
            >
              {/* HEART BURST (mini hearts) */}
              <AnimatePresence>
                {burstKey > 0 && (
                  <motion.div
                    key={`burst-${burstKey}`}
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {particles.map((p) => (
                      <motion.div
                        key={p.id}
                        className="absolute left-1/2 top-1/2"
                        style={{
                          width: p.size,
                          height: p.size,
                          marginLeft: -(p.size / 2),
                          marginTop: -(p.size / 2),
                        }}
                        initial={{ x: 0, y: 0, scale: 0.7, opacity: 0 }}
                        animate={{
                          x: p.dx,
                          y: p.dy,
                          scale: 1,
                          opacity: [0, 1, 0],
                          rotate: p.rot,
                        }}
                        transition={{
                          duration: 0.55,
                          delay: p.delay,
                          ease: "easeOut",
                        }}
                      >
                        <MiniHeart className="w-full h-full text-[#FF5722]" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HEART POP */}
              <motion.div
                key={fav ? "active" : "inactive"}
                initial={{ scale: 0.9, rotate: -18 }}
                animate={{ scale: fav ? 1.2 : 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
              >
                <HeartIcon active={fav} />
              </motion.div>
            </button>
          </div>

          {place.address && <p className="muted">{place.address}</p>}

          {place.description && (
            <p className="text-base leading-relaxed text-white/90">
              {place.description}
            </p>
          )}

          {/* ROUTE BUTTON */}
          <button
            onClick={onRouteClick}
            className={`
              w-full py-3 text-lg focus-ring r-md font-extrabold
              ${inRoute ? "btn-glass" : "btn-orange"}
            `}
          >
            {inRoute ? "✅ В маршруте — убрать" : "➕ Добавить в маршрут"}
          </button>

          <button
            onClick={openBolt}
            className="w-full py-3 text-lg btn-orange focus-ring"
          >
            🚕 Вызвать такси (Bolt)
          </button>
        </div>
      </div>
    </motion.div>
  );
}
