import { useEffect, useMemo } from "react";
import { Link, useRoute } from "wouter";
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

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  dateISO: string;
  category: string;
  coverUrl?: string;
  minutes?: number;
  seoTitle?: string;
  seoDescription?: string;
  content: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | {
        type: "cta";
        title: string;
        text: string;
        primaryLabel: string;
        primaryHref: string;
        secondaryLabel?: string;
        secondaryHref?: string;
      }
    | { type: "faq"; items: Array<{ q: string; a: string }> }
  >;
};

function formatDate(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  if (!y || !m || !d) return dateISO;
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}

export default function BlogPostPage() {
  const { user } = useAuth();
  const ctaHref = user ? "/map" : "/auth";
  const ctaLabel = user ? "Open in Voyonx" : "Sign in to explore";

  const [match, params] = useRoute("/blog/:slug");
  const slug = match ? params.slug : "";

  const posts = useMemo<BlogPost[]>(
    () => [
      {
        slug: "best-places-in-baku-2026",
        title: "Best Places in Baku (2026 Travel Guide)",
        excerpt:
          "Top attractions, viewpoints, Old City highlights and a ready-to-use walking route you can open in Voyonx.",
        dateISO: "2026-02-12",
        category: "Travel Guides",
        minutes: 9,
        coverUrl:
          "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&w=2000&q=70",
        seoTitle: "Best Places in Baku (2026 Travel Guide) | Voyonx",
        seoDescription:
          "Discover the best places in Baku: Old City, landmarks, viewpoints and practical tips. Open the route on Voyonx map.",
        content: [
          {
            type: "p",
            text:
              "Planning a trip to Baku? This guide covers the must-see attractions plus a clean route structure you can open on Voyonx. Save time, avoid missing key spots, and explore confidently.",
          },
          { type: "h2", text: "1) Old City (Icherisheher)" },
          {
            type: "p",
            text:
              "Start in the Old City to feel the real atmosphere: stone streets, courtyards, museums, and iconic views. Visit early to avoid crowds and get better photos.",
          },
          { type: "h2", text: "2) Maiden Tower (Qiz Qalasi)" },
          {
            type: "p",
            text:
              "One of the most recognizable symbols of Baku. Combine it with a short walk around the Old City walls and nearby viewpoints.",
          },
          { type: "h2", text: "3) Seaside Boulevard (Baku Boulevard)" },
          {
            type: "p",
            text:
              "Perfect for an evening walk. If you want a relaxed vibe: sunset + cafes + skyline photos. Great for families too.",
          },
          {
            type: "cta",
            title: "Open this route in Voyonx",
            text:
              "Want all these places on one interactive map with navigation and saved spots? Open the route in Voyonx and start your journey.",
            primaryLabel: "Open Voyonx Map",
            primaryHref: ctaHref,
            secondaryLabel: "Back to Blog",
            secondaryHref: "/blog",
          },
          { type: "h2", text: "FAQ" },
          {
            type: "faq",
            items: [
              { q: "How many days do you need in Baku?", a: "Most travelers enjoy Baku in 2–3 days, depending on day trips and museums." },
              { q: "Is Baku safe for tourists?", a: "In general yes, but keep standard travel awareness: avoid empty streets late at night and use official taxis/apps." },
              { q: "What is the best time to visit Baku?", a: "Spring and autumn are usually the most comfortable for walking and city exploration." },
            ],
          },
          {
            type: "p",
            text:
              "Tip: build your route around walking clusters (Old City + Boulevard + viewpoints) to reduce taxi time. Voyonx helps keep everything in one place.",
          },
        ],
      },
    ],
    [ctaHref]
  );

  const post = posts.find((p) => p.slug === slug);

  useEffect(() => {
    if (!post) return;

    const origin = window.location.origin;
    const url = `${origin}/blog/${post.slug}`;
    const title = post.seoTitle || post.title;
    const description = post.seoDescription || post.excerpt;

    document.title = title;
    setMetaTag("description", description);
    setMetaTag("robots", "index,follow");
    setLinkTag("canonical", url);

    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:type", "article", true);
    setMetaTag("og:url", url, true);
    if (post.coverUrl) setMetaTag("og:image", post.coverUrl, true);

    setJsonLd(`post-${post.slug}`, {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      datePublished: post.dateISO,
      mainEntityOfPage: url,
      image: post.coverUrl ? [post.coverUrl] : undefined,
      author: { "@type": "Organization", name: "Voyonx" },
      publisher: { "@type": "Organization", name: "Voyonx" },
    });
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <h1 className="text-xl font-semibold">Article not found</h1>
          <p className="mt-2 text-white/70">This post doesn’t exist yet.</p>
          <Link href="/blog" className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-medium text-black">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/blog" className="text-sm text-white/70 hover:text-white">
            ← Back
          </Link>

          {/* ✅ умная ссылка справа */}
          <a href={ctaHref} className="text-sm text-white/70 hover:text-white">
            {ctaLabel}
          </a>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{post.category}</span>
            <span>•</span>
            <span>{formatDate(post.dateISO)}</span>
            {post.minutes ? (
              <>
                <span>•</span>
                <span>{post.minutes} min read</span>
              </>
            ) : null}
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{post.title}</h1>
          <p className="mt-2 text-sm text-white/70">{post.excerpt}</p>

          {post.coverUrl ? (
            <img
              src={post.coverUrl}
              alt={post.title}
              className="mt-5 h-56 w-full rounded-2xl border border-white/10 object-cover sm:h-72"
              loading="lazy"
            />
          ) : null}

          <article className="mt-6 space-y-4 text-sm leading-relaxed text-white/80">
            {post.content.map((b, idx) => {
              if (b.type === "h2") {
                return (
                  <h2 key={idx} className="pt-2 text-lg font-semibold text-white">
                    {b.text}
                  </h2>
                );
              }
              if (b.type === "p") {
                return <p key={idx}>{b.text}</p>;
              }
              if (b.type === "cta") {
                return (
                  <div key={idx} className="my-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-base font-semibold text-white">{b.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{b.text}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {/* ✅ ОРАНЖЕВАЯ: Open Voyonx Map */}
                      <a
                        href={b.primaryHref}
                        className="rounded-xl bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95 active:opacity-90"
                      >
                        {b.primaryLabel}
                      </a>
                      {b.secondaryHref && b.secondaryLabel ? (
                        <a
                          href={b.secondaryHref}
                          className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                        >
                          {b.secondaryLabel}
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              }
              if (b.type === "faq") {
                return (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-base font-semibold text-white">FAQ</h3>
                    <div className="mt-3 space-y-3">
                      {b.items.map((it, i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-4">
                          <div className="text-sm font-medium text-white">{it.q}</div>
                          <div className="mt-1 text-sm text-white/70">{it.a}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </article>

          {/* ✅ финальный CTA снизу (тоже умный) */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-base font-semibold">Ready to explore?</div>
            <div className="mt-1 text-sm text-white/70">
              Open Voyonx and save places to your route in seconds.
            </div>
            <div className="mt-4">
              <a
                href={ctaHref}
                className="inline-flex items-center justify-center rounded-xl bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95 active:opacity-90"
              >
                Open Voyonx Map
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
