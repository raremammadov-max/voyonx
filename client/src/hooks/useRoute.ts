import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

export type RouteStop = {
  id: string;
  route_id: string;
  place_id: string;
  position: number;
  visited_at: string | null;
};

export type UserRoute = {
  id: string;
  user_id: string;
  title: string;
};

export function useRoute() {
  const { user } = useAuth();

  const [route, setRoute] = useState<UserRoute | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);

  const ensureRoute = useCallback(async () => {
    if (!user) return null;

    const { data: existing, error: selErr } = await supabase
      .from("user_routes")
      .select("id,user_id,title")
      .eq("user_id", user.id)
      .maybeSingle();

    if (selErr) {
      console.error("Route select error:", selErr);
      return null;
    }

    if (existing) return existing as UserRoute;

    const { data: created, error: insErr } = await supabase
      .from("user_routes")
      .insert({ user_id: user.id, title: "My Route" })
      .select("id,user_id,title")
      .single();

    if (insErr) {
      console.error("Route insert error:", insErr);
      return null;
    }

    return created as UserRoute;
  }, [user]);

  const loadStops = useCallback(async (routeId: string) => {
    const { data, error } = await supabase
      .from("route_stops")
      .select("id,route_id,place_id,position,visited_at")
      .eq("route_id", routeId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Stops load error:", error);
      setStops([]);
      return;
    }

    setStops((data || []) as RouteStop[]);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    const r = route ?? (await ensureRoute());
    if (!r) return;
    await loadStops(r.id);
  }, [user, route, ensureRoute, loadStops]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      if (!user) {
        setRoute(null);
        setStops([]);
        setLoading(false);
        return;
      }

      const r = await ensureRoute();
      setRoute(r);

      if (r) await loadStops(r.id);

      setLoading(false);
    };

    run();
  }, [user, ensureRoute, loadStops]);

  const isInRoute = useCallback(
    (placeId: string) => stops.some((s) => s.place_id === placeId),
    [stops]
  );

  const addToRoute = useCallback(
    async (placeId: string) => {
      if (!user) return;
      const r = route ?? (await ensureRoute());
      if (!r) return;

      if (stops.some((s) => s.place_id === placeId)) return;

      const position = stops.length ? Math.max(...stops.map((s) => s.position)) + 1 : 0;

      const { error } = await supabase.from("route_stops").insert({
        route_id: r.id,
        place_id: placeId,
        position,
      });

      if (error) {
        console.error("Add stop error:", error);
        return;
      }

      await loadStops(r.id);
    },
    [user, route, ensureRoute, stops, loadStops]
  );

  const removeFromRoute = useCallback(
    async (placeId: string) => {
      if (!route) return;

      const { error } = await supabase
        .from("route_stops")
        .delete()
        .eq("route_id", route.id)
        .eq("place_id", placeId);

      if (error) {
        console.error("Remove stop error:", error);
        return;
      }

      const next = stops.filter((s) => s.place_id !== placeId);

      await Promise.all(
        next
          .sort((a, b) => a.position - b.position)
          .map((s, idx) =>
            supabase.from("route_stops").update({ position: idx }).eq("id", s.id)
          )
      );

      await loadStops(route.id);
    },
    [route, stops, loadStops]
  );

  const moveStop = useCallback(
    async (placeId: string, dir: -1 | 1) => {
      if (!route) return;

      const ordered = [...stops].sort((a, b) => a.position - b.position);
      const i = ordered.findIndex((s) => s.place_id === placeId);
      const j = i + dir;

      if (i < 0 || j < 0 || j >= ordered.length) return;

      const a = ordered[i];
      const b = ordered[j];

      const { error: e1 } = await supabase
        .from("route_stops")
        .update({ position: b.position })
        .eq("id", a.id);

      const { error: e2 } = await supabase
        .from("route_stops")
        .update({ position: a.position })
        .eq("id", b.id);

      if (e1 || e2) {
        console.error("Move stop error:", e1 || e2);
        return;
      }

      await loadStops(route.id);
    },
    [route, stops, loadStops]
  );

  const toggleVisited = useCallback(
    async (placeId: string) => {
      if (!route) return;

      const stop = stops.find((s) => s.place_id === placeId);
      if (!stop) return;

      const visited_at = stop.visited_at ? null : new Date().toISOString();

      const { error } = await supabase
        .from("route_stops")
        .update({ visited_at })
        .eq("id", stop.id);

      if (error) {
        console.error("Toggle visited error:", error);
        return;
      }

      await loadStops(route.id);
    },
    [route, stops, loadStops]
  );

  const clearRoute = useCallback(async () => {
    if (!route) return;

    const { error } = await supabase
      .from("route_stops")
      .delete()
      .eq("route_id", route.id);

    if (error) {
      console.error("Clear route error:", error);
      return;
    }

    setStops([]);
  }, [route]);

  return {
    loading,
    route,
    stops,

    refresh,
    clearRoute,

    isInRoute,
    addToRoute,
    removeFromRoute,
    moveStop,
    toggleVisited,
  };
}
