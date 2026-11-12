import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Complaint Tracker",
  description: "Система подсчёта закрытых жалоб администраторов",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen">{children}</body>
    </html>
  );
}