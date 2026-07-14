'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Item {
  id: number;
  user_id: number;
  title: string;
  category: 'lost' | 'found';
  description: string;
  contact: string;
  image: string;
  status: 'pending' | 'claimed' | 'resolved';
  created_at: string;
}

export default function ItemDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setCurrentUserId(parseInt(userId));
    }
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/items/${id}`);
      const data = await response.json();
      if (data.code === 200) {
        setItem(data.data);
      } else {
        setError(data.msg || '获取帖子失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'claimed' | 'resolved') => {
    const token = localStorage.getItem('token');
    if (!token || !item) return;

    try {
      const response = await fetch(`http://localhost:5000/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        setItem(prev => prev ? { ...prev, status: newStatus } : null);
      } else {
        setError(data.error || '操作失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (error || !item) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{error || '帖子不存在'}</h2>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === item.user_id;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {item.image && (
          <div className="relative cursor-pointer" onClick={() => setShowImageModal(true)}>
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
              点击放大
            </div>
          </div>
        )}

        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
                <span className={`text-sm px-2 py-1 rounded ${
                  item.category === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {item.category === 'lost' ? '寻物' : '招领'}
                </span>
                <span className={`text-sm px-2 py-1 rounded ${
                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  item.status === 'claimed' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {item.status === 'pending' ? '待认领' :
                   item.status === 'claimed' ? '已认领' : '已解决'}
                </span>
              </div>
              <p className="text-sm text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">详细描述</h3>
            <p className="text-gray-600 leading-relaxed">{item.description}</p>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">联系方式</h3>
            <p className="text-gray-600">{item.contact}</p>
          </div>

          {isOwner && item.status !== 'resolved' && (
            <div className="flex gap-4 pt-6 border-t">
              {item.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange('claimed')}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  标记为已认领
                </button>
              )}
              {(item.status === 'pending' || item.status === 'claimed') && (
                <button
                  onClick={() => handleStatusChange('resolved')}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  标记为已解决
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回首页
        </Link>
      </div>

      {showImageModal && item.image && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <img
            src={item.image}
            alt={item.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}