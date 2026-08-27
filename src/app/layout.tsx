import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/PwaRegister";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://youtube-preflight.jp";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "YouTube Preflight" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Preflight — YouTube投稿前チェックツール",
    description:
      "YouTube動画のタイトル、サムネイル、概要欄、チャプターなどを無料で投稿前チェック。AI・外部APIを使わずブラウザ内で解析。",
  },
  robots: { index: true, follow: true },
  applicationName: "YouTube Preflight",
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: {
    icon: `${BASE_PATH}/icon.svg`,
    apple: `${BASE_PATH}/icon-180.png`,
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