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
  item_type: string;
  campus: 'kangmei' | 'meilin';
  description: string;
  contact: string;
  image: string;
  status: 'pending' | 'claimed' | 'resolved';
  created_at: string;
  user?: User;
}

const ITEM_TYPES: Record<string, string> = {
  id_card: '证件卡片',
  electronics: '电子设备',
  stationery: '学习用品',
  daily: '生活日用',
  sports: '体育器材',
  other: '其他'
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [campusFilter, setCampusFilter] = useState<'all' | 'kangmei' | 'meilin'>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchItems();
  }, [filter, campusFilter, itemTypeFilter, statusFilter]);

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
        if (campusFilter !== 'all') {
          url += `&campus=${campusFilter}`;
        }
        if (itemTypeFilter) {
          url += `&item_type=${itemTypeFilter}`;
        }
      } else {
        const params: string[] = [];
        if (campusFilter !== 'all') {
          params.push(`campus=${campusFilter}`);
        }
        if (itemTypeFilter) {
          params.push(`item_type=${itemTypeFilter}`);
        }
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
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
    : items.filter(item => {
        const categoryMatch = filter === 'all' || item.category === filter;
        const statusMatch = statusFilter === 'all' || 
                          (statusFilter === 'pending' && item.status === 'pending') ||
                          (statusFilter === 'completed' && item.status !== 'pending');
        return categoryMatch && statusMatch;
      });

  const lostCount = items.filter(i => i.category === 'lost').length;
  const foundCount = items.filter(i => i.category === 'found').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const completedCount = items.filter(i => i.status !== 'pending').length;

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl p-8" style={{ backgroundColor: '#e4cfe4' }}>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">📦 失物招领系统</h1>
        <p className="text-gray-600">AI智能匹配，让失物早日回家</p>
        <div className="flex gap-8 mt-6">
          <button
            onClick={() => { setFilter('all'); setStatusFilter('all'); }}
            className="flex flex-col items-start p-4 rounded-xl hover:bg-white/50 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-bold text-gray-800">{items.length}</div>
            <div className="text-gray-500 text-sm">总帖子数</div>
          </button>
          <button
            onClick={() => { setFilter('lost'); setStatusFilter('all'); }}
            className="flex flex-col items-start p-4 rounded-xl hover:bg-white/50 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-bold text-red-600">{lostCount}</div>
            <div className="text-gray-500 text-sm">寻物启事</div>
          </button>
          <button
            onClick={() => { setFilter('found'); setStatusFilter('all'); }}
            className="flex flex-col items-start p-4 rounded-xl hover:bg-white/50 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-bold text-green-600">{foundCount}</div>
            <div className="text-gray-500 text-sm">失物招领</div>
          </button>
          <button
            onClick={() => { setStatusFilter('pending'); }}
            className="flex flex-col items-start p-4 rounded-xl hover:bg-white/50 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-gray-500 text-sm">待认领</div>
          </button>
          <button
            onClick={() => { setStatusFilter('completed'); }}
            className="flex flex-col items-start p-4 rounded-xl hover:bg-white/50 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-bold text-gray-600">{completedCount}</div>
            <div className="text-gray-500 text-sm">已完成</div>
          </button>
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
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('lost')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'lost' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔴 寻物
            </button>
            <button
              onClick={() => setFilter('found')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'found' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🟢 招领
            </button>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
              className="appearance-none px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors pr-8 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="all">全部状态</option>
              <option value="pending">⏳ 待认领</option>
              <option value="completed">✅ 已完成</option>
            </select>
            <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="relative">
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value as 'all' | 'kangmei' | 'meilin')}
              className="appearance-none px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors pr-8 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="all">所有校区</option>
              <option value="kangmei">🏫 康美</option>
              <option value="meilin">🏫 美林</option>
            </select>
            <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="relative">
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              className="appearance-none px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors pr-8 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">所有分类</option>
              <option value="id_card">证件卡片</option>
              <option value="electronics">电子设备</option>
              <option value="stationery">学习用品</option>
              <option value="daily">生活日用</option>
              <option value="sports">体育器材</option>
              <option value="other">其他</option>
            </select>
            <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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
                  <div className="flex flex-wrap items-center gap-2 mb-2">
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
                    <span className="text-sm px-2 py-1 rounded bg-blue-50 text-blue-600">
                      {item.campus === 'kangmei' ? '康美校区' : '美林校区'}
                    </span>
                    <span className="text-sm px-2 py-1 rounded bg-purple-50 text-purple-600">
                      {ITEM_TYPES[item.item_type] || item.item_type}
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