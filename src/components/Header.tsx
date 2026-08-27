"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
      className="flex items-center gap-2 rounded-lg focus-visible:outline-accent"
      aria-label="YouTube Preflight ホーム"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="6" fill="var(--accent)" />
        <path d="M10 8.5v11l9-5.5-9-5.5z" fill="#fff" />
        <path d="M10 8.5v11l9-5.5-9-5.5z" fill="#fff" opacity="0.4" transform="translate(0,0)" />
      </svg>
      <span className="text-base font-bold leading-tight tracking-tight text-foreground">
        YouTube<span className="text-accent"> Preflight</span>
      </span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="モバイルメニュー" className="border-t border-border md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV.map((item) => (
              <li key={item.href}>
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
        </nav>
      )}
    </header>
  );
}

function cnHeader(scrolled: boolean): string {
  const cls =
    "sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur transition-shadow";
  return scrolled ? `${cls} shadow-sm` : cls;
}