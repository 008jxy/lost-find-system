'use client';

import { useEffect, useState } from 'react';

interface Item {
  id: number;
  title: string;
  category: 'lost' | 'found';
  description: string;
  contact: string;
  status: 'pending' | 'resolved';
  created_at: string;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📦 失物招领系统</h1>
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="border p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <span className={`text-sm px-2 py-1 rounded ${item.category === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {item.category === 'lost' ? '丢失' : '捡到'}
                </span>
                <span className={`ml-2 text-sm px-2 py-1 rounded ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                  {item.status === 'pending' ? '待认领' : '已解决'}
                </span>
                <p className="text-gray-600 mt-2">{item.description}</p>
                <p className="text-sm text-gray-400 mt-1">联系方式：{item.contact}</p>
              </div>
              <div className="text-sm text-gray-400">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}