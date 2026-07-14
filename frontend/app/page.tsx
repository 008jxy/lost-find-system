'use client';

import { useEffect, useState } from 'react';
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

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');

  useEffect(() => {
    fetch('http://localhost:5000/api/items')
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('获取数据失败:', error);
        setLoading(false);
      });
  }, []);

  const filteredItems = items.filter(item => 
    filter === 'all' || item.category === filter
  );

  const lostCount = items.filter(i => i.category === 'lost').length;
  const foundCount = items.filter(i => i.category === 'found').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">📦 失物招领系统</h1>
        <p className="text-blue-100">AI智能匹配，让失物早日回家</p>
        <div className="flex gap-8 mt-6">
          <div>
            <div className="text-3xl font-bold">{items.length}</div>
            <div className="text-blue-200 text-sm">总帖子数</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{lostCount}</div>
            <div className="text-blue-200 text-sm">寻物启事</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{foundCount}</div>
            <div className="text-blue-200 text-sm">失物招领</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{pendingCount}</div>
            <div className="text-blue-200 text-sm">待认领</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部 ({items.length})
        </button>
        <button
          onClick={() => setFilter('lost')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            filter === 'lost' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🔴 寻物 ({lostCount})
        </button>
        <button
          onClick={() => setFilter('found')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            filter === 'found' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🟢 招领 ({foundCount})
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">暂无帖子</h2>
          <p className="text-gray-500">成为第一个发布帖子的人吧！</p>
          <Link
            href="/profile"
            className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            去发布帖子
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
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
                    <span className={`text-sm px-2 py-1 rounded ${
                      item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      item.status === 'claimed' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {item.status === 'pending' ? '待认领' :
                       item.status === 'claimed' ? '已认领' : '已解决'}
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