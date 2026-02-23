import { Geist, Geist_Mono } from "next/font/google";
import './Styles/globals.css';
import './Styles/custom.css';
import { Providers } from './Provider/providers';
import { ToasterProvider } from './Provider/ToasterProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SuperMarket POS | Management System",
  description: "Advanced high-performance Point of Sale and Inventory Management System for modern supermarkets.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ToasterProvider />
          {children}
        </Providers>
      </body>
    </html>
  );
}

