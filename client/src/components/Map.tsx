import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import CategoryFilter from "@/components/CategoryFilter";
import { useLocation } from "wouter";
import { useFavorites } from "@/hooks/useFavorites";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MAP_PITCH = 60;
const MAP_BEARING = -20;

type Place = {
  id: string;
  title: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category?: string | null;
  image_url?: string | null;
};

type LatLng = { lat: number; lng: number };

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

const clean = (v: string | null | undefined) => (v ?? "").trim();
const catKey = (v: string) => clean(v).toLowerCase();

const wordsOf = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .split(/[^\p{L}\p{N}]+/gu)
    .filter(Boolean);

const startsWithWord = (text: string, query: string) => {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return wordsOf(text).some((w) => w.startsWith(q));
};

function uniqueCategoriesFromPlaces(places: Place[]) {
  const m = new globalThis.Map<string, string>();
  for (const p of places) {
    const raw = clean(p.category);
    if (!raw) continue;
    const k = catKey(raw);
    if (!m.has(k)) m.set(k, raw);
  }
  return Array.from(m.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2l2.92 6.4 6.96.6-5.26 4.56 1.58 6.78L12 16.9 5.8 20.34l1.58-6.78L2.12 9l6.96-.6L12 2z"
        fill={active ? "#FF5722" : "transparent"}
        stroke={active ? "#FF5722" : "rgba(255,255,255,0.75)"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Mobile: shows normal single-line text when it fits.
 * If it overflows -> starts marquee AFTER 1s delay (premium).
 */
function MobileSmartText({
  text,
  className = "",
  speedSec = 12,
}: {
  text: string;
  className?: string;
  speedSec?: number;
}) {
  const t = (text ?? "").trim();

  const measureRef = useRef<HTMLDivElement | null>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!t) return;

    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      const need = el.scrollWidth > el.clientWidth + 1;
      setShouldMarquee(need);
    };

    measure();

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, [t]);

  useEffect(() => {
    setPlay(false);
    if (!shouldMarquee) return;

    const id = window.setTimeout(() => setPlay(true), 1000);
    return () => window.clearTimeout(id);
  }, [shouldMarquee, t]);

  if (!t) return null;

  return (
    <div className={["sm:hidden overflow-hidden", className].join(" ")}>
      {!shouldMarquee ? (
        <div ref={measureRef} className="whitespace-nowrap truncate">
          {t}
        </div>
      ) : (
        <div
          className={[
            "voyonx-marquee whitespace-nowrap will-change-transform",
            play ? "is-playing" : "is-paused",
          ].join(" ")}
          style={{ ["--dur" as any]: `${speedSec}s` }}
          aria-label={t}
        >
          <span className="mr-10">{t}</span>
          <span className="mr-10">{t}</span>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const [, setLocation] = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [nearMode, setNearMode] = useState(false);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const radiusKm = 3;

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const removeAllMarkers = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  };

  const clearUserMarker = () => {
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  };

  const goToPlacePage = (place: Place) => {
    setLocation(`/place/${place.id}`);
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/raremammadov/cmksyb54d007501sd1zjmdl2n",
      center: [49.8671, 40.4093],
      zoom: 12,

      // ✅ Always start 3D
      pitch: MAP_PITCH,
      bearing: MAP_BEARING,
    });

    map.on("load", () => {
      // ✅ Ensure 3D after style load (no animation)
      map.easeTo({ pitch: MAP_PITCH, bearing: MAP_BEARING, duration: 0 });
    });

    map.on("click", () => {
      setSearchOpen(false);
      setSelectedPlace(null);
    });

    mapRef.current = map;

    return () => {
      removeAllMarkers();
      clearUserMarker();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("places")
        .select("id, title, address, latitude, longitude, category, image_url");

      setLoading(false);

      if (error || !data) {
        setAllPlaces([]);
        return;
      }

      setAllPlaces(data as Place[]);
    };

    run();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (nearMode) return;
    if (search.trim()) return;

    const cats = uniqueCategoriesFromPlaces(allPlaces);
    if (cats.length === 0) return;

    const currentOk =
      category && cats.some((c) => catKey(c) === catKey(category));
    if (!currentOk) setCategory(cats[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, allPlaces]);

  const qNorm = search.trim().toLowerCase();

  const placesForRender = useMemo(() => {
    let list = allPlaces;

    if (!qNorm) {
      if (category) {
        const active = clean(category);
        list = list.filter((p) => clean(p.category) === active);
      }

      if (nearMode && userLoc) {
        list = list
          .map((p) => ({
            place: p,
            dist: haversineKm(userLoc, { lat: p.latitude, lng: p.longitude }),
          }))
          .filter((x) => x.dist <= radiusKm)
          .sort((a, b) => a.dist - b.dist)
          .map((x) => x.place);
      }
    }

    if (qNorm) {
      list = list.filter((p) => startsWithWord(p.title || "", qNorm));
    }

    return list;
  }, [allPlaces, category, nearMode, userLoc, qNorm]);

  const searchResults = useMemo(() => {
    if (!qNorm) return [];
    return placesForRender.slice(0, 8);
  }, [placesForRender, qNorm]);

  useEffect(() => {
    if (!mapRef.current) return;

    removeAllMarkers();

    placesForRender.forEach((place) => {
      const el = document.createElement("button");
      el.type = "button";
      el.style.background = "transparent";
      el.style.border = "none";
      el.style.cursor = "pointer";

      el.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24">
          <path d="M12 22s7-5.5 7-12a7 7 0 1 0-14 0c0 6.5 7 12 7 12Z" fill="#FF5722"/>
          <circle cx="12" cy="10" r="2.8" fill="white"/>
        </svg>
      `;

      el.onclick = (e) => {
        e.stopPropagation();
        setSearchOpen(false);
        setSelectedPlace(place);

        mapRef.current?.flyTo({
          center: [place.longitude, place.latitude],
          zoom: Math.max(mapRef.current?.getZoom() ?? 12, 13),
          duration: 500,
          pitch: MAP_PITCH,
          bearing: MAP_BEARING,
        });
      };

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([place.longitude, place.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [placesForRender]);

  const setUserMarker = (pos: LatLng) => {
    if (!mapRef.current) return;

    clearUserMarker();

    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "999px";
    el.style.background = "#2563EB";
    el.style.border = "2px solid white";
    el.style.boxShadow = "0 0 0 6px rgba(37, 99, 235, 0.25)";
    el.style.pointerEvents = "none";

    userMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([pos.lng, pos.lat])
      .addTo(mapRef.current);
  };

  const onNearMe = () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается в этом браузере.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(next);
        setNearMode(true);
        setCategory(null);
        setSearch("");
        setSearchOpen(false);
        setSelectedPlace(null);
        setUserMarker(next);

        mapRef.current?.flyTo({
          center: [next.lng, next.lat],
          zoom: 14,
          pitch: MAP_PITCH,
          bearing: MAP_BEARING,
        });
      },
      (err) => {
        alert(
          "Не удалось получить геолокацию. Проверь разрешение в браузере и что сайт открыт по HTTPS.\n\n" +
            `Ошибка: ${err.message}`,
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // ✅ fit bounds (category-mode) but KEEP 3D during animation (no flip)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (nearMode) return;
    if (qNorm) return;
    if (!placesForRender.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    for (const p of placesForRender) bounds.extend([p.longitude, p.latitude]);

    try {
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 14,
        duration: 650,

        // ✅ key fix: keep 3D while fitting
        pitch: MAP_PITCH,
        bearing: MAP_BEARING,
      } as any);
    } catch {
      // ignore
    }
  }, [category, nearMode, qNorm, placesForRender]);

  const favActive = selectedPlace ? isFavorite(selectedPlace.id) : false;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Marquee CSS */}
      <style>{`
        .voyonx-marquee {
          display: inline-flex;
          align-items: center;
          animation: voyonx-marquee var(--dur, 12s) linear infinite;
        }
        .voyonx-marquee.is-paused { animation-play-state: paused; }
        .voyonx-marquee.is-playing { animation-play-state: running; }

        @keyframes voyonx-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .voyonx-marquee { animation: none; }
        }
      `}</style>

      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Top islands */}
      <div className="absolute inset-x-0 top-[92px] z-40 pointer-events-none">
        <div className="mx-auto max-w-6xl px-4 space-y-4">
          <div className="pointer-events-auto">
            <CategoryFilter
              active={category}
              onChange={(v) => {
                setCategory(v);
                setNearMode(false);
                setUserLoc(null);
                clearUserMarker();
                setSearch("");
                setSearchOpen(false);
                setSelectedPlace(null);
              }}
              onNearMe={onNearMe}
              nearActive={nearMode}
              onSearchChange={(v) => {
                setSearch(v);
                setSearchOpen(true);
                setSelectedPlace(null);

                if (v.trim()) {
                  setNearMode(false);
                  setUserLoc(null);
                  clearUserMarker();
                }
              }}
            />
          </div>

          {searchOpen && qNorm && (
            <div className="pointer-events-auto glass r-lg overflow-hidden max-w-[640px]">
              {searchResults.length > 0 ? (
                searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => goToPlacePage(p)}
                    className="w-full px-4 py-3 text-left hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/60 text-lg">
                            🖼️
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-extrabold truncate">{p.title}</div>
                        {p.address && (
                          <div className="text-sm opacity-70 truncate">
                            {p.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-white">
                  <div className="font-extrabold">Locations not found</div>
                  <div className="text-sm opacity-70 mt-1">
                    Try another name.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom island */}
      {selectedPlace && (
        <div className="absolute inset-x-0 bottom-4 z-50 pointer-events-none">
          <div className="mx-auto max-w-6xl px-4">
            <div className="pointer-events-auto glass r-lg">
              <div className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Image + text */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 shrink-0">
                      {selectedPlace.image_url ? (
                        <img
                          src={selectedPlace.image_url}
                          alt={selectedPlace.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/60 text-lg">
                          🖼️
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Desktop */}
                      <div className="hidden sm:block">
                        <div className="font-extrabold truncate">
                          {selectedPlace.title}
                        </div>
                        <div className="text-sm opacity-70 truncate">
                          {selectedPlace.address ?? "No address"}
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="sm:hidden">
                        <MobileSmartText
                          text={selectedPlace.title}
                          className="font-extrabold text-white"
                          speedSec={12}
                        />
                        <MobileSmartText
                          text={selectedPlace.address ?? "No address"}
                          className="text-sm text-white/70 mt-0.5"
                          speedSec={14}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 sm:justify-end sm:ml-auto">
                    <button
                      type="button"
                      onClick={() => goToPlacePage(selectedPlace)}
                      className="h-10 px-4 rounded-full bg-[#FF5722] text-white font-extrabold flex-1 sm:flex-none"
                      style={{ boxShadow: "0 10px 24px rgba(255,87,34,0.35)" }}
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleFavorite(selectedPlace.id)}
                      className={[
                        "h-10 px-3 rounded-full font-extrabold",
                        "border border-white/15 bg-white/10 text-white",
                        "flex items-center gap-2 justify-center",
                        "flex-1 sm:flex-none",
                      ].join(" ")}
                      title="Favorites"
                    >
                      <StarIcon active={favActive} />
                      <span>Favorites</span>
                    </button>
                  </div>
                </div>

                {/* handle */}
                <div className="mt-3 flex justify-center">
                  <div className="h-1 w-12 rounded-full bg-white/25" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
