import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/PwaRegister";

const SITE = "https://youtube-preflight.jp";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "YouTube Preflight — YouTube投稿前チェックツール",
    template: "%s | YouTube Preflight",
  },
  description:
    "YouTube動画のタイトル、サムネイル、概要欄、チャプターなどを無料で投稿前チェック。AI・外部APIを使わずブラウザ内で解析。",
  keywords: [
    "YouTube",
    "投稿前チェック",
    "サムネイル",
    "タイトル",
    "概要欄",
    "チャプター",
    "ハッシュタグ",
    "無料ツール",
  ],
  authors: [{ name: "YouTube Preflight" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "YouTube Preflight",
    title: "YouTube Preflight — YouTube投稿前チェックツール",
    description:
      "YouTube動画のタイトル、サムネイル、概要欄、チャプターなどを無料で投稿前チェック。AI・外部APIを使わずブラウザ内で解析。",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Preflight — YouTube投稿前チェックツール",
    description:
      "YouTube動画のタイトル、サムネイル、概要欄、チャプターなどを無料で投稿前チェック。AI・外部APIを使わずブラウザ内で解析。",
  },
  robots: { index: true, follow: true },
  applicationName: "YouTube Preflight",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f14" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="skip-link">
          メインコンテンツへスキップ
        </a>
        <ThemeProvider>
          <Header />
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
            {children}
          </main>
          <Footer />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}