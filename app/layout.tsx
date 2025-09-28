
import type { Metadata } from 'next';
import './globals.css';
import NavBar from './components/NavBar';

export const metadata: Metadata = {
  title: 'ImageFactory — Modern Image Toolkit',
  description: 'Convert, enhance, and compose images with a suite of elegant web tools.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-[#EEF2F9] via-[#F8F9FB] to-[#E6EBF6] text-slate-900 antialiased">
        <NavBar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 lg:px-8">{children}</main>
        <footer className="pb-10 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ImageFactory · Crafted with care</p>
        </footer>
      </body>
    </html>
  );
}
