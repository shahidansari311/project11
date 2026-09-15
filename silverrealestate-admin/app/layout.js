import "./globals.css";
import "../public/styles/global.scss";
import { Providers } from "./providers";

export const metadata = {
  title: "SilverReal Estate Admin",
  description: "Admin panel for SilverReal Estate",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}