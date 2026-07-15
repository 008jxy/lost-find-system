'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateToken, clearAuthStorage } from '../utils/auth';

interface Notification {
  id: number;
  title: string;
  content: string;
  related_item_id: number;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await validateToken();
      if (!isValid) {
        clearAuthStorage();
        router.push('/login');
      } else {
        setIsLoggedIn(true);
        fetchNotifications();
      }
      setIsValidated(true);
    };
    checkAuth();
  }, [router]);

  const sortNotifications = (notifs: Notification[]): Notification[] => {
    return [...notifs].sort((a, b) => {
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setNotifications(sortNotifications(data.notifications || []));
    } catch (err) {
      console.error('获取通知失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(sortNotifications(updated));
    } catch (err) {
      console.error('标记失败:', err);
    }
  };

  const deleteNotification = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  if (!isValidated) {
    return <div className="text-center py-8">验证中...</div>;
  }

  if (!isLoggedIn) {
    return <div className="text-center py-8">正在跳转登录页面...</div>;
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-600 mb-2">🔔 通知中心</h1>
        <p className="text-gray-500">AI匹配推送的相似帖子提醒</p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">暂无通知</h2>
          <p className="text-gray-500">当AI匹配到相似帖子时，会在这里通知您</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-md p-6 transition-all ${
                !notification.read ? 'border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {notification.related_item_id ? (
                    <Link href={`/items/${notification.related_item_id}`}>
                      <h3 className={`font-semibold mb-2 ${
                        !notification.read ? 'text-gray-900' : 'text-gray-600'
                      } hover:text-purple-600 cursor-pointer`}>
                        {notification.title}
                      </h3>
                    </Link>
                  ) : (
                    <h3 className={`font-semibold mb-2 ${
                      !notification.read ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {notification.title}
                    </h3>
                  )}
                  <p className="text-gray-600 mb-2">{notification.content}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                    >
                      标为已读
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}