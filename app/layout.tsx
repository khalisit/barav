import './globals.css';
import type { Metadata } from 'next';
import { Poppins, Noto_Sans_Arabic } from 'next/font/google';
import { Providers } from '@/components/providers';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-noto-sans-arabic',
});

export const metadata: Metadata = {
  title: 'Barav Quiz',
  description: 'Enterprise admin dashboard for the Barav Quiz platform.',
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${notoSansArabic.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
