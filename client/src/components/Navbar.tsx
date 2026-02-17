// Navbar.tsx
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

const JUST_LOGGED_OUT_KEY = "voyonx_justLoggedOut";

export function Navbar() {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();

  // ✅ Прячем navbar на welcome и auth
  if (location === "/" || location === "/auth") return null;

  const handleLogout = () => {
    // ✅ помечаем, что мы пришли на welcome именно после выхода
    sessionStorage.setItem(JUST_LOGGED_OUT_KEY, "1");

    // ✅ сначала уводим на welcome (мгновенно, без ожиданий сети)
    setLocation("/");

    // ✅ потом выходим
    Promise.resolve(signOut?.()).catch(() => {
      // даже если упало — мы уже на welcome
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="glass-strong r-lg">
          <div className="h-16 px-4 flex items-center justify-between text-white">
            {/* LOGO (welcome только через logout) */}
            <Link
              href="/map"
              className="flex items-center gap-3 text-white"
              aria-label="Go to map"
            >
              <img
                src="https://gldrmopcpppdtefdfagz.supabase.co/storage/v1/object/public/assets/voyonx_logo.png"
                alt="voyonx"
                className="h-9 w-9 object-contain"
                loading="lazy"
              />
              <span className="font-narrow text-lg tracking-tight text-white">
                voyonx
              </span>
            </Link>

            {user ? (
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-11 w-11 rounded-full btn-glass focus-ring"
                      aria-label="Open menu"
                    >
                      <Menu className="h-6 w-6 text-white" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-40 bg-white text-black border border-black/10 shadow-lg"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuItem
                      onClick={() => setLocation("/route")}
                      className="
                        cursor-pointer rounded-md font-semibold
                        hover:bg-[#FF5722] hover:text-white
                        focus:bg-[#FF5722] focus:text-white
                        data-[highlighted]:bg-[#FF5722]
                        data-[highlighted]:text-white
                      "
                    >
                      My Route
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setLocation("/favorites")}
                      className="
                        cursor-pointer rounded-md font-semibold
                        hover:bg-[#FF5722] hover:text-white
                        focus:bg-[#FF5722] focus:text-white
                        data-[highlighted]:bg-[#FF5722]
                        data-[highlighted]:text-white
                      "
                    >
                      Favorites
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setLocation("/profile")}
                      className="
                        cursor-pointer rounded-md font-semibold
                        hover:bg-[#FF5722] hover:text-white
                        focus:bg-[#FF5722] focus:text-white
                        data-[highlighted]:bg-[#FF5722]
                        data-[highlighted]:text-white
                      "
                    >
                      Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="
                        cursor-pointer rounded-md font-semibold
                        hover:bg-[#FF5722] hover:text-white
                        focus:bg-[#FF5722] focus:text-white
                        data-[highlighted]:bg-[#FF5722]
                        data-[highlighted]:text-white
                      "
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/auth">
                <Button className="btn-orange px-5 py-2 focus-ring">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
