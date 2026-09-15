import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Silverreal Estate",
  description: "Democratizing Architectural Wealth",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`scroll-smooth scroll-pt-24 ${inter.variable} ${jetBrainsMono.variable}`}>
      <body className="font-sans antialiased bg-background text-gray-900">{children}</body>
    </html>
  );
}
