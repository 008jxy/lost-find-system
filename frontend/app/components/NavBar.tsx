'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import API_BASE_URL from '../utils/api';

export default function NavBar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.code === 200) {
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
        console.error('获取未读消息数失败:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/post', label: '发布' },
    { href: '/messages', label: '消息', showBadge: true },
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
                className={`text-lg transition-colors relative ${
                  pathname === item.href
                    ? 'text-purple-600 font-medium'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                {item.label}
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}