import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "Workout Tracker",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b0b0f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Workout Tracker",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
