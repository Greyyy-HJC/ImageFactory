
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'ImageFactory' },
  { href: '/image2pdf', label: 'Image2PDF' },
  { href: '/photocollage', label: 'PhotoCollage' },
  { href: '/imageresolution', label: 'ImageResolution' },
  { href: '/cutout', label: 'Cutout' },
  { href: '/stylization', label: 'Stylization' }
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          ImageFactory
        </Link>
        <nav className="hidden gap-3 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#007AFF]/10 text-[#0A84FF] shadow-sm'
                    : 'text-slate-600 hover:text-[#0A84FF]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <span className="text-sm font-medium text-slate-500">菜单</span>
        </div>
      </div>
    </header>
  );
}
