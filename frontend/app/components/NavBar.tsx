'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/post', label: '发布' },
    { href: '/profile', label: '我的' },
    { href: '/notifications', label: '通知' },
    { href: '/match', label: 'AI匹配' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="px-6 lg:px-8">
        <div className="flex justify-start items-center h-16 gap-8">
          <Link href="/" className="text-3xl font-bold text-purple-600">
            📦 失物招领
          </Link>
          <div className="flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-lg transition-colors ${
                  pathname === item.href
                    ? 'text-purple-600 font-medium'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}