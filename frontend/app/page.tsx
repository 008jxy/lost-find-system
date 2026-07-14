'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  avatar: string;
}

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
  user?: User;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchItems();
  }, [filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/items';
      if (searchKeyword) {
        url = `http://localhost:5000/api/items/search?keyword=${encodeURIComponent(searchKeyword)}&category=${filter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (searchKeyword && Array.isArray(data)) {
        setItems(data);
      } else if (!searchKeyword) {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = searchKeyword 
    ? items 
    : items.filter(item => filter === 'all' || item.category === filter);

  const lostCount = items.filter(i => i.category === 'lost').length;
  const foundCount = items.filter(i => i.category === 'found').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl p-8" style={{ backgroundColor: '#e4cfe4' }}>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">📦 失物招领系统</h1>
        <p className="text-gray-600">AI智能匹配，让失物早日回家</p>
        <div className="flex gap-8 mt-6">
          <div>
            <div className="text-3xl font-bold text-gray-800">{items.length}</div>
            <div className="text-gray-500 text-sm">总帖子数</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{lostCount}</div>
            <div className="text-gray-500 text-sm">寻物启事</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{foundCount}</div>
            <div className="text-gray-500 text-sm">失物招领</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{pendingCount}</div>
            <div className="text-gray-500 text-sm">待认领</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索物品名称或描述..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              filter === 'all' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部 ({searchKeyword ? filteredItems.length : items.length})
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
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {searchKeyword ? '未找到相关帖子' : '暂无帖子'}
          </h2>
          <p className="text-gray-500">
            {searchKeyword ? '试试其他关键词吧！' : '成为第一个发布帖子的人吧！'}
          </p>
          <Link
            href="/profile"
            className="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            去发布帖子
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
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
                    <div className="flex items-center gap-2">
                      <img
                        src={item.user?.avatar || '/avatar-male.jpg'}
                        alt={item.user?.username || '用户'}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-gray-500">{item.user?.username || '匿名用户'}</span>
                    </div>
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