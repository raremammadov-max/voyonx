import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

function setMetaTag(nameOrProp: string, content: string, isProp = false) {
  const selector = isProp ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    if (isProp) tag.setAttribute("property", nameOrProp);
    else tag.setAttribute("name", nameOrProp);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setLinkTag(rel: string, href: string) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function setJsonLd(id: string, json: unknown) {
  const scriptId = `jsonld-${id}`;
  let tag = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!tag) {
    tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.id = scriptId;
    document.head.appendChild(tag);
  }
  tag.text = JSON.stringify(json);
}

type BlogCategory = "Travel Guides" | "Itineraries" | "Hidden Gems" | "Restaurants" | "Tips";

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  dateISO: string;
  coverUrl?: string;
  minutes?: number;
  keywords?: string[];
};

function formatDate(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  if (!y || !m || !d) return dateISO;
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}

export default function BlogPage() {
  const { user } = useAuth();

  // ✅ единая логика: авторизован → /map, нет → /auth
  const ctaHref = user ? "/map" : "/auth";
  const ctaLabel = user ? "Open in Voyonx" : "Sign in to explore";

  const posts: BlogPost[] = useMemo(
    () => [
      {
        slug: "best-places-in-baku-2026",
        title: "Best Places in Baku (2026 Travel Guide)",
        excerpt:
          "Top attractions, viewpoints, Old City highlights and a ready-to-use walking route you can open in Voyonx.",
        category: "Travel Guides",
        dateISO: "2026-02-12",
        minutes: 9,
        coverUrl:
          "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&w=1600&q=70",
        keywords: ["Baku travel guide", "things to do in Baku", "Baku attractions"],
      },
      {
        slug: "baku-in-2-days-walking-route",
        title: "Baku in 2 Days: A Perfect Walking Route",
        excerpt:
          "A two-day itinerary with stops, timing tips, and a map-friendly structure for exploring Baku efficiently.",
        category: "Itineraries",
        dateISO: "2026-02-12",
        minutes: 8,
        coverUrl:
          "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=70",
        keywords: ["Baku itinerary", "Baku in 2 days", "walking route Baku"],
      },
      {
        slug: "hidden-gems-old-city-baku",
        title: "Hidden Gems in Baku Old City (Icherisheher)",
        excerpt:
          "Small courtyards, secret viewpoints, quiet streets and places tourists usually miss — with practical tips.",
        category: "Hidden Gems",
        dateISO: "2026-02-12",
        minutes: 7,
        coverUrl:
          "https://images.unsplash.com/photo-1562813733-b31f71025d54?auto=format&fit=crop&w=1600&q=70",
        keywords: ["Icherisheher", "hidden gems Baku", "Old City Baku"],
      },
      {
        slug: "best-restaurants-in-baku-for-tourists",
        title: "Best Restaurants in Baku for Tourists",
        excerpt:
          "Where to try local cuisine, what to order, how much it costs — plus areas that are easiest for tourists.",
        category: "Restaurants",
        dateISO: "2026-02-12",
        minutes: 10,
        coverUrl:
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=70",
        keywords: ["Baku restaurants", "Azerbaijani cuisine", "where to eat in Baku"],
      },
      {
        slug: "is-baku-safe-for-travelers",
        title: "Is Baku Safe for Travelers? Practical Tips",
        excerpt:
          "Safety, scams to avoid, transport and neighborhood tips — written for first-time visitors.",
        category: "Tips",
        dateISO: "2026-02-12",
        minutes: 6,
        coverUrl:
          "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1600&q=70",
        keywords: ["Is Baku safe", "Baku travel tips", "Azerbaijan safety"],
      },
    ],
    []
  );

  const featured = posts[0];
  const categories: BlogCategory[] = ["Travel Guides", "Itineraries", "Hidden Gems", "Restaurants", "Tips"];

  useEffect(() => {
    const origin = window.location.origin;
    const url = `${origin}/blog`;

    const title = "Baku & Azerbaijan Travel Blog | Voyonx";
    const description =
      "Travel guides, walking routes, restaurants and hidden gems in Baku and across Azerbaijan. Plan trips smarter with Voyonx.";

    document.title = title;
    setMetaTag("description", description);
    setMetaTag("robots", "index,follow");
    setLinkTag("canonical", url);

    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:type", "website", true);
    setMetaTag("og:url", url, true);

    setJsonLd("blog", {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Voyonx Travel Blog",
      url,
      description,
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        datePublished: p.dateISO,
        url: `${origin}/blog/${p.slug}`,
      })),
    });
  }, [posts]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8">
        {/* HERO */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Baku & Azerbaijan Travel Blog</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            Discover walking routes, hidden gems, restaurants and practical travel guides. Open routes directly on the
            Voyonx map.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {/* ✅ ОРАНЖЕВАЯ: Explore Voyonx Map */}
            <a
              href={ctaHref}
              className="rounded-xl bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95 active:opacity-90"
            >
              Explore Voyonx Map
            </a>

            <a
              href={`/blog/${featured.slug}`}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Read featured guide
            </a>
          </div>
        </div>

        {/* FEATURED */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
        >
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
            <div className="relative sm:col-span-2">
              {featured.coverUrl ? (
                <img src={featured.coverUrl} alt={featured.title} className="h-48 w-full object-cover sm:h-full" loading="lazy" />
              ) : (
                <div className="h-48 w-full bg-white/10 sm:h-full" />
              )}
              <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs text-white/90 backdrop-blur">
                Featured
              </div>
            </div>

            <div className="p-5 sm:col-span-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{featured.category}</span>
                <span>•</span>
                <span>{formatDate(featured.dateISO)}</span>
                {featured.minutes ? (
                  <>
                    <span>•</span>
                    <span>{featured.minutes} min read</span>
                  </>
                ) : null}
              </div>

              <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{featured.title}</h2>
              <p className="mt-2 text-sm text-white/70">{featured.excerpt}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/blog/${featured.slug}`}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
                >
                  Read article
                </Link>

                {/* ✅ умная кнопка */}
                <a
                  href={ctaHref}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  {ctaLabel}
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CATEGORIES */}
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              {c}
            </span>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(1).map((p) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              {p.coverUrl ? (
                <img src={p.coverUrl} alt={p.title} className="h-40 w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-40 w-full bg-white/10" />
              )}

              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{p.category}</span>
                  <span>•</span>
                  <span>{formatDate(p.dateISO)}</span>
                  {p.minutes ? (
                    <>
                      <span>•</span>
                      <span>{p.minutes} min</span>
                    </>
                  ) : null}
                </div>

                <h3 className="mt-2 text-base font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-1 text-sm text-white/70">{p.excerpt}</p>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black transition hover:opacity-90"
                  >
                    Read
                  </Link>

                  {/* ✅ умная кнопка */}
                  <a
                    href={ctaHref}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    {ctaLabel}
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SEO TEXT BLOCK */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">About Voyonx Travel Blog</h2>
          <div className="mt-2 space-y-3 text-sm text-white/70 leading-relaxed">
            <p>
              Voyonx is a travel platform built to help tourists explore Baku and Azerbaijan with an interactive map,
              curated places, and route planning. Our blog includes Baku travel guides, walking itineraries, restaurant
              recommendations, and hidden gems that you can instantly open on the Voyonx map.
            </p>
            <p>
              If you’re planning your first trip, start with our “Best Places in Baku” guide and then use Voyonx to
              build a route around the Old City (Icherisheher), seaside boulevard, viewpoints, and cultural landmarks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
