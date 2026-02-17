import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, profile, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) setLocation("/auth");
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl md:col-span-1" />
          <Skeleton className="h-64 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  const displayName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "User";

  const email = user.email || "—";

  return (
    <div className="min-h-screen pb-20">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="glass-strong r-lg p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-extrabold text-white">
              {displayName}
            </h1>

            <p className="muted">{email}</p>

            <p className="muted">
              Member since{" "}
              {user.created_at
                ? format(new Date(user.created_at), "MMMM yyyy")
                : "Recently"}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
