import './globals.css';
import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';

const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const display = Sora({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'], display: 'swap' });

export const metadata: Metadata = {
  title: 'THE CITY – Your business deserves a place in the city',
  description: 'A virtual business marketplace: claim a plot, build your storefront and get discovered by walking visitors.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${body.variable} ${display.variable}`}><body>{children}</body></html>;
}
