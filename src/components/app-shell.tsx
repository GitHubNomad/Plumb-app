import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Compass, House, MessageCircle } from "lucide-react";
import { usePlumb } from "@/lib/plumb/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Today", icon: House },
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/progress", label: "Progress", icon: Compass },
  { to: "/coach", label: "Coach", icon: MessageCircle },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideNav = pathname.startsWith("/session/");

  useEffect(() => {
    void usePlumb.persist.rehydrate();
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full max-w-lg flex-col",
          !hideNav && "pb-24",
        )}
      >
        {children}
      </div>
      {!hideNav ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur-md"
          aria-label="Primary"
        >
          <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium tracking-wide transition-colors duration-150",
                      active ? "text-copper" : "text-muted",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
