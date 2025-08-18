import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Softphone Governor",
  description: "Control plane for softphone",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="border-b border-gray-200 bg-white">
          <div className="container py-4 flex items-center justify-between">
            <div className="text-xl font-bold text-black">Softphone Governor</div>
            <div className="text-sm text-black">Control & Manage</div>
          </div>
        </div>
        <main className="container py-8 min-h-screen bg-white">{children}</main>
      </body>
    </html>
  );
}
