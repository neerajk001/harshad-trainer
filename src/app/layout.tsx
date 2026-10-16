import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ServiceWorkerRegister } from "@/components/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Harsh Gorul — Trainer & Client",
    template: "%s · Harsh Gorul",
  },
  description: "Trainers manage clients and assign workout + diet plans. Clients log progress.",
  applicationName: "Harsh Gorul",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Harsh Gorul",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // In dev, unregister any service worker + clear caches left over from a
  // previous `next build && next start` on the same origin. Without this, the
  // stale production worker/shell is served against the dev server and Next's
  // version-mismatch check can hard-reload the page in a loop.
  const devCleanup = `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})})}if(self.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})})}`;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {process.env.NODE_ENV === "production" ? null : (
          <script dangerouslySetInnerHTML={{ __html: devCleanup }} />
        )}
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
