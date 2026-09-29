import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Procrastination Police — AI catches you wasting time.",
  description:
    "Share your screen. Stay on task. Or get arrested by an unnecessarily judgmental AI productivity cop. A website, a siren, and zero tolerance for your excuses.",
  applicationName: "Procrastination Police",
  openGraph: {
    title: "Procrastination Police 🚨",
    description:
      "AI catches you wasting time. Your just-one-more-video era is over.",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
