// Home.tsx
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Map from "@/components/Map";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // ✅ если не авторизован — возвращаем на welcome, а не на auth
    if (!user) setLocation("/");
  }, [user, setLocation]);

  // ✅ не рендерим карту, пока решается редирект
  if (!user) return null;

  return <Map />;
}
