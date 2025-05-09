import './globals.css'
import { Toaster } from 'sonner';
import { Roboto } from 'next/font/google'


const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto',
  display: 'swap'
})

export const metadata = {
  title: 'Medi-Scan',
  description: 'Medical record dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${roboto.className} bg-black text-white hide-scrollbar`} suppressHydrationWarning>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
