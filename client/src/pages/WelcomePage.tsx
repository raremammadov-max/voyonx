// WelcomePage.tsx
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import azMiniMap from "@/assets/azerbaijan-mini.png";
import { useAuth } from "@/hooks/use-auth";

const JUST_LOGGED_OUT_KEY = "voyonx_justLoggedOut";

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [leaving, setLeaving] = useState(false);
  const navTimer = useRef<number | null>(null);

  const navigatePremium = useCallback(
    (target: string) => {
      if (leaving) return;
      setLeaving(true);
      navTimer.current = window.setTimeout(() => {
        setLocation(target);
      }, 260);
    },
    [leaving, setLocation]
  );

  useEffect(() => {
    if (!user) return;

    const justLoggedOut = sessionStorage.getItem(JUST_LOGGED_OUT_KEY) === "1";
    if (justLoggedOut) {
      sessionStorage.removeItem(JUST_LOGGED_OUT_KEY);
      return;
    }

    navigatePremium("/map");
  }, [user, navigatePremium]);

  useEffect(() => {
    return () => {
      if (navTimer.current) window.clearTimeout(navTimer.current);
    };
  }, []);

  const handleExplore = () => {
    navigatePremium(user ? "/map" : "/auth");
  };

  return (
    <motion.div
      className="relative min-h-[100svh] w-full bg-black text-white overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-[#FF5722]/20 blur-3xl" />
        <div className="absolute -bottom-56 -right-48 h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl items-center px-5 md:px-8">
        <motion.div
          className="grid w-full grid-cols-1 gap-10 md:grid-cols-2"
          initial={{ opacity: 0, y: 10, scale: 0.995 }}
          animate={{
            opacity: leaving ? 0 : 1,
            y: leaving ? -6 : 0,
            scale: leaving ? 0.992 : 1,
          }}
          transition={{ duration: 0.26, ease: "easeOut" }}
        >
          {/* LEFT */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-[#FF5722]" />
              Voyonx • Explore Azerbaijan
            </div>

            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Discover places.
              <span className="text-[#FF5722]"> Build routes.</span>
              <br />
              Travel smarter.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              Voyonx helps you find the best spots across Azerbaijan and create your own travel route — from cafés and
              museums to nature and hidden gems.
            </p>

            <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-white">📍 Places</div>
                <div className="mt-1 text-white/60">Curated locations & categories</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-white">🗺️ Route</div>
                <div className="mt-1 text-white/60">Build a personal journey list</div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleExplore}
                disabled={leaving}
                className="h-11 rounded-xl bg-[#FF5722] px-6 text-sm font-medium text-white
                           hover:opacity-95 active:opacity-90 transition disabled:opacity-70"
              >
                Explore map
              </button>

              <Link href="/auth">
                <a
                  className="h-11 rounded-xl border border-white/15 bg-white/5 px-6
                             text-sm font-medium text-white/90 hover:bg-white/10
                             flex items-center justify-center transition"
                >
                  Sign in / Continue
                </a>
              </Link>
            </div>

            <div className="mt-4 text-xs text-white/45">No scroll • one-screen welcome • fast start</div>
          </div>

          {/* RIGHT — БОЛЬШАЯ КАРТА БЕЗ РАМКИ */}
          <div className="relative flex items-center justify-center md:justify-end">
            <img
              src={azMiniMap}
              alt="Azerbaijan map"
              draggable={false}
              className="w-full max-w-[560px] select-none"
            />
          </div>
        </motion.div>
      </div>

      {/* ✅ FOOTER (Blog link) */}
      <div className="absolute bottom-4 left-0 right-0 z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 md:px-8">
          <div className="text-xs text-white/35">© {new Date().getFullYear()} Voyonx</div>

          <div className="flex items-center gap-4">
            <Link href="/blog">
              <a className="text-xs text-white/55 hover:text-white transition">Blog</a>
            </Link>
            <a
              href="/map"
              className="text-xs text-white/55 hover:text-white transition"
              onClick={(e) => {
                // чтобы не дергалось при leaving
                if (leaving) {
                  e.preventDefault();
                  return;
                }
              }}
            >
              Open map
            </a>
          </div>
        </div>
      </div>

      {leaving && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.22 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}
