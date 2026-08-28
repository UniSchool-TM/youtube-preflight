"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/components/ui";

const NAV = [
  { href: "/", label: "ホーム" },
  { href: "/diagnose", label: "診断" },
  { href: "/compare", label: "比較" },
  { href: "/history", label: "履歴" },
  { href: "/settings", label: "設定" },
  { href: "/about", label: "このツールについて" },
];

function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-accent"
      aria-label="YouTube Preflight ホーム"
    >
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0 transition-transform group-hover:-translate-y-0.5">
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        <path d="M6.5 15.8h2.2M9.2 18.2h1.9" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        <path d="M7.2 17.7 16.4 24l8.4-13.6-.5-.9L8.6 15z" fill="#fff" />
        <path d="M16.9 23.9 12 17.2l10-2.4z" fill="var(--accent)" opacity="0.9" />
        <path d="M12.2 20.6 6.5 14.4h3.6l2 2.9z" fill="#fff" opacity="0.75" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-extrabold tracking-tight text-foreground">
          YouTube<span className="text-accent"> Preflight</span>
        </span>
        <span className="mt-0.5 font-hand text-xs text-muted">pre-flight check ✈</span>
      </span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  // Close mobile menu when navigating to a different route
  // (adjusting state during render; avoids closing on first mount)
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll lock + Escape while the mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cnHeader(scrolled)}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav aria-label="メインナビゲーション" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={
                    isActive(item.href)
                      ? "rounded-lg bg-accent/10 px-3 py-2 text-sm font-semibold text-accent"
                      : "rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-border/50 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-6 w-6">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className={cn(
                "absolute inset-0 m-auto transition-all duration-300 ease-out",
                open ? "scale-75 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
              )}
            >
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className={cn(
                "absolute inset-0 m-auto transition-all duration-300 ease-out",
                open ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-90 opacity-0"
              )}
            >
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </div>
      <div className="relative md:hidden">
        {open && (
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            className="anim-fade-in fixed inset-0 z-20 bg-black/30 backdrop-blur-[2px]"
          />
        )}
        <nav
          id="mobile-nav"
          aria-label="モバイルメニュー"
          aria-hidden={!open}
          inert={!open ? true : undefined}
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out",
            open ? "pointer-events-auto grid-rows-[1fr]" : "pointer-events-none grid-rows-[0fr]"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-border">
              <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
                {NAV.map((item, i) => (
                  <li
                    key={item.href}
                    style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
                    className={cn(
                      "transition-all duration-300 ease-out",
                      open ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
                    )}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={
                        isActive(item.href)
                          ? "block rounded-lg bg-accent/10 px-3 py-3 text-sm font-semibold text-accent"
                          : "block rounded-lg px-3 py-3 text-sm font-medium text-muted hover:text-foreground"
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

function cnHeader(scrolled: boolean): string {
  const cls =
    "sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur pt-[env(safe-area-inset-top)] transition-shadow";
  return scrolled ? `${cls} shadow-sm` : cls;
}