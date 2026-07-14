'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateToken, clearAuthStorage } from '../../utils/auth';

interface User {
  id: number;
  username: string;
  avatar: string;
}

interface Item {
  id: number;
  title: string;
  category: 'lost' | 'found';
  description: string;
  contact: string;
  image: string;
  status: 'pending' | 'claimed' | 'resolved';
  created_at: string;
  user?: User;
}

export default function UserPostsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await validateToken();
      if (!isValid) {
        clearAuthStorage();
        router.push('/');
      }
      setIsValidated(true);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/user/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.code === 200) {
        let filtered = data.data;
        if (filter === 'pending') {
          filtered = filtered.filter((item: Item) => item.status === 'pending');
        } else if (filter === 'completed') {
          filtered = filtered.filter((item: Item) => item.status === 'claimed' || item.status === 'resolved');
        }
        setItems(filtered);
      }
    } catch (error) {
      console.error('获取帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidated) {
    return <div className="text-center py-8">验证中...</div>;
  }

  const getStatusLabel = (status: string) => {
    if (status === 'pending') return '待处理';
    if (status === 'claimed') return '已认领';
    if (status === 'resolved') return '已解决';
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (status === 'claimed') return 'bg-orange-100 text-orange-700';
    if (status === 'resolved') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profile" className="text-purple-600 hover:text-purple-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">我的帖子</h1>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-xl font-medium transition-all ${
            filter === 'all' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部 ({items.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-6 py-2 rounded-xl font-medium transition-all ${
            filter === 'pending' ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          待处理
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-6 py-2 rounded-xl font-medium transition-all ${
            filter === 'completed' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          已完成
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">暂无帖子</h2>
          <Link
            href="/post"
            className="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            去发布帖子
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex">
                {item.image && (
                  <div className="w-32 h-32 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                    <span className={`text-sm px-2 py-1 rounded ${
                      item.category === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.category === 'lost' ? '寻物' : '招领'}
                    </span>
                    <span className={`text-sm px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">联系方式：{item.contact}</p>
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}