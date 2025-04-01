import type { Metadata } from "next";
import { Roboto } from 'next/font/google';
import "./globals.css";
import ClientProvider from "@/hoc/ClientProvider";

const font = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ['latin'], 
});

export const metadata: Metadata = {
  title: "Medi-Scan",
  description: "Mini Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${font.className} antialised`}>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
