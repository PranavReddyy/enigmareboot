import { Geist, Geist_Mono } from "next/font/google";
import { TeamProvider } from "@/contexts/TeamContext";
import BinaryBackground from "@/components/BinaryBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Reboot Games",
  description: "Linear multi-stage online competition platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black relative min-h-screen`}
      >
        {/* Binary Background */}
        <BinaryBackground />

        {/* Main Content */}
        <div className="relative z-10">
          <TeamProvider>{children}</TeamProvider>
        </div>
      </body>
    </html>
  );
}
