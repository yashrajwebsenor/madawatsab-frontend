import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthGuard from "./components/layouts/AuthGuard";
import Providers from "./components/layouts/Providers";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Madawatsab",
  icons: {
    icon: "/assets/images/logo.png",
    apple: "/assets/images/logo.png",
  },
};

// Drives the <meta name="viewport"> tag. Without it mobile browsers render at a
// desktop width and ignore our Tailwind breakpoints. maximumScale stays high so
// pinch-zoom remains available (accessibility) — we never lock scaling.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
