import type { Metadata } from "next";
import { Poppins, Charis_SIL } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const charisSIL = Charis_SIL({
  variable: "--font-charis",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Land Lock",
  description: "helping you understand your urban risk exposure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${charisSIL.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
