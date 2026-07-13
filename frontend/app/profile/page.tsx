'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Profile() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) setUsername(user);
  }, []);

  if (!username) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-md mx-auto">
        <div className="text-6xl mb-6">👤</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">请登录</h2>
        <p className="text-gray-500 mb-6">登录后可以发布帖子、查看通知</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            注册
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="text-6xl">👤</div>
          <div>
            <h2 className="text-2xl font-bold">{username}</h2>
            <p className="text-blue-200">欢迎回来！</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              window.location.href = '/';
            }}
            className="ml-auto px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">0</div>
          <div className="text-gray-500">我的帖子</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600">0</div>
          <div className="text-gray-500">已认领</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-yellow-600">0</div>
          <div className="text-gray-500">待处理</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">我的操作</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/post"
            className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="text-4xl">📝</div>
            <div>
              <div className="font-medium text-gray-800">发布帖子</div>
              <div className="text-sm text-gray-500">发布寻物启事或失物招领</div>
            </div>
          </Link>
          <Link
            href="/notifications"
            className="flex items-center gap-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="text-4xl">🔔</div>
            <div>
              <div className="font-medium text-gray-800">我的通知</div>
              <div className="text-sm text-gray-500">查看AI匹配推送</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}