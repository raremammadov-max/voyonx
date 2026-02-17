import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL =
  "https://gldrmopcpppdtefdfagz.supabase.co/storage/v1/object/public/assets/voyonx_logo.png";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const handleAuth = async (action: "login" | "signup") => {
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (action === "login") {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      if (result.error) throw result.error;

      if (action === "signup") {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        setTab("login");
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,87,34,0.10),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(255,255,255,0.06),_transparent_45%)]" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src={LOGO_URL}
              alt="Voyonx"
              className="h-10 w-auto mb-5 select-none"
              draggable={false}
            />
            <h1 className="text-white text-2xl sm:text-3xl font-semibold">
              {tab === "login" ? "Log in to Voyonx" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Your premium gateway to curated experiences.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-[#121212] shadow-[0_30px_70px_rgba(0,0,0,0.60)] p-6 sm:p-7">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 bg-transparent border border-white/10 rounded-xl p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-lg data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <AnimatePresence mode="wait">
                  <TabsContent value="login" key="login" className="m-0">
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                          <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 pl-10 bg-[#1b1b1b] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-[#FF5722]"
                          />
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                          <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleAuth("login")
                            }
                            className="h-11 pl-10 bg-[#1b1b1b] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-[#FF5722]"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="text-xs text-white/45 hover:text-white/70 transition"
                            onClick={() =>
                              toast({
                                title: "Not implemented yet",
                                description:
                                  "Password reset will be added later.",
                              })
                            }
                          >
                            Forgot your password?
                          </button>
                        </div>
                      </div>

                      <Button
                        className="w-full h-11 font-semibold text-white bg-[#FF5722] hover:bg-[#ff6a3f] active:bg-[#ef4f1f]"
                        onClick={() => handleAuth("login")}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in…
                          </>
                        ) : (
                          "Log in"
                        )}
                      </Button>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="signup" key="signup" className="m-0">
                    <motion.div
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                          <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 pl-10 bg-[#1b1b1b] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-[#FF5722]"
                          />
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                          <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleAuth("signup")
                            }
                            className="h-11 pl-10 bg-[#1b1b1b] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-[#FF5722]"
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full h-11 font-semibold text-white bg-[#FF5722] hover:bg-[#ff6a3f] active:bg-[#ef4f1f]"
                        onClick={() => handleAuth("signup")}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating…
                          </>
                        ) : (
                          <>
                            Create account{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>

                      <p className="pt-2 text-[11px] text-white/40 text-center">
                        By continuing, you agree to our Terms of Service and
                        Privacy Policy.
                      </p>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </div>
            </Tabs>
          </div>

          <div className="text-center mt-6 text-sm text-white/45">
            {tab === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  className="text-white underline underline-offset-4"
                  onClick={() => setTab("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="text-white underline underline-offset-4"
                  onClick={() => setTab("login")}
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
