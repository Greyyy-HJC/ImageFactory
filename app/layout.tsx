import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ImageFactory — Image2PDF',
  description: 'Convert images to beautifully formatted PDFs online.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
