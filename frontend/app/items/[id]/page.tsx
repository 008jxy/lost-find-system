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
  found_time: string;
  found_location: string;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    contact: '',
    found_time: '',
    found_location: '',
  });

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
        setEditForm({
          title: data.data.title,
          description: data.data.description,
          contact: data.data.contact,
          found_time: data.data.found_time,
          found_location: data.data.found_location,
        });
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
      if (data.code === 200) {
        setItem(prev => prev ? { ...prev, status: newStatus } : null);
      } else {
        setError(data.msg || '操作失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !item) return;

    try {
      const response = await fetch(`http://localhost:5000/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (data.code === 200) {
        setItem(data.data);
        setIsEditing(false);
      } else {
        setError(data.msg || '编辑失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个帖子吗？')) return;

    const token = localStorage.getItem('token');
    if (!token || !item) return;

    try {
      const response = await fetch(`http://localhost:5000/api/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.code === 200) {
        router.push('/');
      } else {
        setError(data.msg || '删除失败');
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
            className="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === item.user_id;
  const now = new Date().toISOString().slice(0, 16);

  return (
    <div className="max-w-4xl mx-auto lg:max-w-5xl">
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
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  {isEditing ? '取消' : '编辑'}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  删除
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">标题</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">详细描述</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">联系方式</label>
                <input
                  type="text"
                  value={editForm.contact}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contact: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">拾得时间</label>
                <input
                  type="datetime-local"
                  value={editForm.found_time}
                  onChange={(e) => setEditForm(prev => ({ ...prev, found_time: e.target.value }))}
                  max={now}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">拾得地点</label>
                <input
                  type="text"
                  value={editForm.found_location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, found_location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="px-8 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  保存修改
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">详细描述</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">联系方式</h3>
                <p className="text-gray-600">{item.contact}</p>
              </div>

              {(item.found_time || item.found_location) && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">拾得信息</h3>
                  {item.found_time && (
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">拾得时间：{item.found_time}</span>
                    </div>
                  )}
                  {item.found_location && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-600">拾得地点：{item.found_location}</span>
                    </div>
                  )}
                </div>
              )}

              {isOwner && item.status === 'pending' && (
                <div className="flex justify-center gap-4 pt-6 border-t">
                  {item.category === 'lost' ? (
                    <button
                      onClick={() => handleStatusChange('resolved')}
                      className="px-8 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      标记为已解决
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange('claimed')}
                      className="px-8 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      标记为已认领
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
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