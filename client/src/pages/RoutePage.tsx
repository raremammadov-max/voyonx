import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useRoute } from "@/hooks/useRoute";
import { supabase } from "@/lib/supabase";

type Place = {
  id: string;
  title: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

const ROUTE_SOURCE_ID = "route-line-source";
const ROUTE_LAYER_ID = "route-line-layer";

export default function RoutePage() {
  const { loading, stops, removeFromRoute, moveStop, toggleVisited, clearRoute } = useRoute();

  const [places, setPlaces] = useState<Place[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(
    null
  );

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Journey mode state (локально)
  const [journeyOn, setJourneyOn] = useState(false);

  const orderedStops = useMemo(
    () => stops.slice().sort((a, b) => a.position - b.position),
    [stops]
  );

  const nextUnvisitedStop = useMemo(
    () => orderedStops.find((s) => !s.visited_at) ?? null,
    [orderedStops]
  );

  const visitedCount = useMemo(
    () => orderedStops.filter((s) => !!s.visited_at).length,
    [orderedStops]
  );

  const totalCount = orderedStops.length;

  const progressPct = useMemo(() => {
    if (!totalCount) return 0;
    return Math.round((visitedCount / totalCount) * 100);
  }, [visitedCount, totalCount]);

  const nextPlace = useMemo(() => {
    if (!nextUnvisitedStop) return null;
    return places.find((p) => p.id === nextUnvisitedStop.place_id) ?? null;
  }, [nextUnvisitedStop, places]);

  // ✅ завершено: есть stops, но нет nextUnvisited
  const journeyFinished = totalCount > 0 && !nextUnvisitedStop;

  useEffect(() => {
    if (journeyFinished && journeyOn) setJourneyOn(false);
  }, [journeyFinished, journeyOn]);

  // 1) load places in stop order
  useEffect(() => {
    const run = async () => {
      if (!orderedStops.length) {
        setPlaces([]);
        setRouteInfo(null);
        return;
      }

      const ids = orderedStops.map((s) => s.place_id);

      const { data, error } = await supabase
        .from("places")
        .select("id,title,address,latitude,longitude")
        .in("id", ids);

      if (error) {
        console.error("Route places load error:", error);
        setPlaces([]);
        return;
      }

      const m = new Map((data || []).map((p: any) => [p.id, p]));
      const ordered = ids.map((id) => m.get(id)).filter(Boolean) as Place[];
      setPlaces(ordered);
    };

    run();
  }, [orderedStops]);

  // 2) init map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [49.8671, 40.4093],
      zoom: 11,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ======= ROUTE DRAW (устойчивый) =======
  const drawRoute = useCallback(async (map: mapboxgl.Map, placesForRoute: Place[]) => {
    if (placesForRoute.length < 2) {
      setRouteInfo(null);
      if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
      if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
      return;
    }

    const cleaned = placesForRoute.filter(
      (p) =>
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude) &&
        Math.abs(p.latitude) <= 90 &&
        Math.abs(p.longitude) <= 180
    );

    const deduped: Place[] = [];
    for (const p of cleaned) {
      const prev = deduped[deduped.length - 1];
      if (!prev || prev.latitude !== p.latitude || prev.longitude !== p.longitude) deduped.push(p);
    }

    if (deduped.length < 2) {
      setRouteInfo(null);
      if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
      if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
      return;
    }

    const MAX_COORDS = 25;
    const limited = deduped.slice(0, MAX_COORDS);

    const coords = limited.map((p) => `${p.longitude},${p.latitude}`).join(";");
    const token = mapboxgl.accessToken;

    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&overview=full&access_token=${token}`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Directions HTTP ${res.status}: ${text.slice(0, 180)}`);
    }

    const json = await res.json();
    const r = json?.routes?.[0];

    if (!r?.geometry) {
      throw new Error(`Directions missing geometry: ${JSON.stringify(json)?.slice(0, 220)}`);
    }

    setRouteInfo({
      distanceKm: Math.round((r.distance / 1000) * 10) / 10,
      durationMin: Math.round(r.duration / 60),
    });

    const geojson = {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry: r.geometry }],
    } as any;

    if (map.getSource(ROUTE_SOURCE_ID)) {
      (map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: geojson });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-width": 5, "line-opacity": 0.9, "line-color": "#FF5722" },
      });
    }
  }, []);

  const scheduleDrawRoute = useCallback(
    (placesForRoute: Place[]) => {
      const map = mapRef.current;
      if (!map) return;

      const run = async (attempt: 1 | 2) => {
        const styleReady =
          typeof (map as any).isStyleLoaded === "function"
            ? (map as any).isStyleLoaded()
            : map.loaded();

        if (!styleReady) {
          map.once("idle", () => run(attempt));
          return;
        }

        try {
          await drawRoute(map, placesForRoute);
        } catch (e) {
          console.warn("Route draw failed:", e);

          if (attempt === 1) {
            window.setTimeout(() => run(2), 450);
            return;
          }

          try {
            if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
            if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
          } catch {
            // ignore
          }
          setRouteInfo(null);
        }
      };

      run(1);
    },
    [drawRoute]
  );

  // 3) markers + route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    (map as any).__markers?.forEach((m: mapboxgl.Marker) => m.remove());
    (map as any).__markers = [];

    if (!places.length) {
      try {
        if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
        if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
      } catch {
        // ignore
      }
      setRouteInfo(null);
      return;
    }

    // ✅ Маркеры: visited -> green, not visited -> orange
    places.forEach((p, idx) => {
      const stop = orderedStops[idx];
      const visited = !!stop?.visited_at;

      const el = document.createElement("div");
      el.style.width = "28px";
      el.style.height = "28px";
      el.style.borderRadius = "999px";
      el.style.display = "grid";
      el.style.placeItems = "center";
      el.style.fontWeight = "800";
      el.style.background = visited ? "#22C55E" : "#FF5722"; // ✅ green / orange
      el.style.color = "white";
      el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";
      el.innerText = String(idx + 1);

      const marker = new mapboxgl.Marker(el).setLngLat([p.longitude, p.latitude]).addTo(map);
      (map as any).__markers.push(marker);
    });

    const bounds = new mapboxgl.LngLatBounds();
    places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
    map.fitBounds(bounds, { padding: 70, duration: 500 });

    scheduleDrawRoute(places);
  }, [places, orderedStops, scheduleDrawRoute]);

  // auto-scroll to next unvisited (only when not finished)
  useEffect(() => {
    if (!nextUnvisitedStop) return;
    const el = document.getElementById(`stop-${nextUnvisitedStop.place_id}`);
    if (!el) return;

    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    return () => window.clearTimeout(t);
  }, [nextUnvisitedStop?.place_id, places.length]);

  const startJourney = () => {
    if (!totalCount || journeyFinished) return;
    setJourneyOn(true);

    if (nextUnvisitedStop) {
      const el = document.getElementById(`stop-${nextUnvisitedStop.place_id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (places.length >= 2) scheduleDrawRoute(places);
  };

  const stopJourney = () => setJourneyOn(false);

  const markNextVisited = async () => {
    if (!nextUnvisitedStop) return;
    await toggleVisited(nextUnvisitedStop.place_id);
  };

  const onResetRoute = async () => {
    if (!totalCount) return;
    const ok = window.confirm("Сбросить маршрут? Все точки будут удалены.");
    if (!ok) return;

    setJourneyOn(false);
    await clearRoute();
  };

  // ✅ кнопки одинаковые + <a> как кнопка
  const BTN_BASE =
    "focus-ring inline-flex items-center justify-center h-11 px-5 r-md font-extrabold whitespace-nowrap w-full lg:w-auto";
  const BTN_ORANGE = `btn-orange ${BTN_BASE}`;
  const BTN_DARK = `${BTN_BASE} bg-black/40 border border-white/20 text-white hover:bg-white/10`;
  const BTN_RESET = `${BTN_BASE} bg-black/40 border border-[#FF5722] text-[#FF5722] hover:bg-[#FF5722] hover:text-white`;

  // ✅ скрываем полосу скролла (но оставляем скролл)
  const HIDE_SCROLLBAR =
    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

  return (
    <motion.div
      className="mx-auto max-w-6xl px-4 py-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="glass-strong r-lg p-6 mb-4">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold text-white">My Route</h1>

            <div className="muted mt-1">
              {totalCount} stops
              {routeInfo ? ` · ${routeInfo.distanceKm} km · ~${routeInfo.durationMin} min` : ""}
            </div>

            <div className="mt-4">
              <div className="grid gap-1 text-xs text-white/70 sm:flex sm:items-center sm:justify-between">
                <span>
                  Progress: {visitedCount}/{totalCount} ({progressPct}%)
                </span>
                <span>{journeyOn ? "Journey mode: ON" : "Journey mode: OFF"}</span>
              </div>

              <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progressPct}%`, background: "#FF5722" }}
                />
              </div>

              {nextPlace ? (
                <div className="mt-3 text-white/85 text-sm">
                  Next stop: <span className="font-extrabold">{nextPlace.title}</span>
                </div>
              ) : totalCount ? (
                <div className="mt-3 text-white/85 text-sm">✅ All stops visited. Nice!</div>
              ) : null}
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:justify-end">
              {journeyFinished ? (
                <Link href="/">
                  <a className={`${BTN_ORANGE} col-span-2 lg:col-auto`}>Create new route</a>
                </Link>
              ) : journeyOn ? (
                <>
                  <button
                    onClick={markNextVisited}
                    disabled={!nextUnvisitedStop}
                    className={`${BTN_ORANGE} col-span-2 lg:col-auto ${
                      nextUnvisitedStop ? "" : "opacity-60"
                    }`}
                  >
                    Mark next visited
                  </button>

                  <button onClick={stopJourney} className={BTN_DARK}>
                    Stop
                  </button>

                  <button
                    onClick={onResetRoute}
                    disabled={!totalCount}
                    className={`${BTN_RESET} ${totalCount ? "" : "opacity-60"}`}
                  >
                    Reset
                  </button>

                  <Link href="/">
                    <a className={BTN_ORANGE}>Explore</a>
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={startJourney}
                    disabled={!totalCount}
                    className={`${BTN_ORANGE} col-span-2 lg:col-auto ${
                      totalCount ? "" : "opacity-60"
                    }`}
                  >
                    Start Journey
                  </button>

                  <button
                    onClick={onResetRoute}
                    disabled={!totalCount}
                    className={`${BTN_RESET} ${totalCount ? "" : "opacity-60"}`}
                  >
                    Reset
                  </button>

                  <Link href="/">
                    <a className={BTN_ORANGE}>Explore</a>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className={`glass r-lg p-5 overflow-auto max-h-[520px] ${HIDE_SCROLLBAR}`}>
          {loading ? (
            <div className="muted">Loading…</div>
          ) : orderedStops.length === 0 ? (
            <div className="text-white">
              <div className="font-extrabold text-xl">Route is empty</div>
              <div className="muted mt-2">Open a place and tap “Add to route”.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {places.map((p, idx) => {
                const stop = orderedStops[idx];
                const visited = !!stop?.visited_at;
                const isNext = nextUnvisitedStop?.place_id === p.id;

                return (
                  <div
                    key={p.id}
                    id={`stop-${p.id}`}
                    className={`
                      glass-strong r-lg p-4 text-white
                      ${journeyOn && isNext ? "ring-2 ring-[#FF5722]" : ""}
                      ${visited ? "opacity-75" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-extrabold">
                          {idx + 1}. {p.title}
                        </div>
                        {p.address ? <div className="muted mt-1">{p.address}</div> : null}

                        {/* ✅ Visited text same size as normal text */}
                        {visited ? (
                          <div className="text-sm mt-2 text-white/70">✅ Visited</div>
                        ) : journeyOn && isNext ? (
                          <div className="text-xs mt-2 text-white/80">➜ Next stop</div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          className="btn-glass focus-ring h-9 px-3 r-md text-sm whitespace-nowrap"
                          onClick={() => toggleVisited(p.id)}
                        >
                          {visited ? "Unvisit" : "Visited"}
                        </button>

                        <div className="flex gap-2">
                          <button
                            className="btn-glass focus-ring h-9 w-10 r-md"
                            onClick={() => moveStop(p.id, -1)}
                            title="Up"
                          >
                            ↑
                          </button>
                          <button
                            className="btn-glass focus-ring h-9 w-10 r-md"
                            onClick={() => moveStop(p.id, 1)}
                            title="Down"
                          >
                            ↓
                          </button>
                        </div>

                        <button
                          className="btn-glass focus-ring h-9 px-3 r-md text-sm whitespace-nowrap"
                          onClick={() => removeFromRoute(p.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass r-lg overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-[520px]" />
        </div>
      </div>
    </motion.div>
  );
}
