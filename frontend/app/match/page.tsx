'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { validateToken } from '../utils/auth';
import API_BASE_URL from '../utils/api';

interface MatchItem {
  item_id: number;
  title: string;
  description: string;
  contact: string;
  similarity: number;
}

interface MatchResult {
  lost_item: {
    id: number;
    title: string;
    description: string;
    contact: string;
  };
  found_item: {
    id: number;
    title: string;
    description: string;
    contact: string;
  };
  similarity: number;
}

export default function MatchPage() {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [myMatches, setMyMatches] = useState<MatchItem[]>([]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [inputCategory, setInputCategory] = useState<'lost' | 'found'>('lost');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await validateToken();
      setIsLoggedIn(isValid);
      setIsValidated(true);
      if (isValid) {
        fetchMyMatches();
      }
    };
    checkAuth();
  }, []);

  const fetchMyMatches = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.code === 200) {
        const response = await fetch(`${API_BASE_URL}/api/items`);
        const items = await response.json();
        const myItems = items.filter((item: { user_id: number }) => item.user_id === data.data.id);
        
        const allMatches: MatchItem[] = [];
        const seenIds = new Set<number>();
        
        for (const item of myItems) {
          if (item.status !== 'pending') continue;
          
          const matchResponse = await fetch(`${API_BASE_URL}/api/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: item.title,
              description: item.description,
              category: item.category,
            }),
          });
          const matchData = await matchResponse.json();
          if (matchData.matches && matchData.matches.length > 0) {
            for (const match of matchData.matches) {
              if (!seenIds.has(match.item_id)) {
                seenIds.add(match.item_id);
                allMatches.push(match);
              }
            }
          }
        }
        
        allMatches.sort((a, b) => b.similarity - a.similarity);
        setMyMatches(allMatches);
      }
    } catch (err) {
      console.error('获取我的匹配失败:', err);
    }
  };

  const handleBatchMatch = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setMatches(data.matches || []);
      setMyMatches([]);
    } catch (err) {
      console.error('批量匹配失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleMatch = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }
    
    if (!inputTitle || !inputDesc) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/match`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: inputTitle,
          description: inputDesc,
          category: inputCategory,
        }),
      });
      const data = await response.json();
      setMyMatches(data.matches || []);
      setMatches([]);
    } catch (err) {
      console.error('匹配失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidated) {
    return <div className="text-center py-8">验证中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-600 mb-2">🤖 AI智能匹配</h1>
        <p className="text-gray-500">基于文本相似度算法，自动匹配相似帖子</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📝 测试匹配</h2>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value="lost"
                checked={inputCategory === 'lost'}
                onChange={(e) => setInputCategory('lost')}
                className="w-4 h-4 text-purple-600"
              />
              <span className="ml-2 text-gray-700">寻物启事</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value="found"
                checked={inputCategory === 'found'}
                onChange={(e) => setInputCategory('found')}
                className="w-4 h-4 text-purple-600"
              />
              <span className="ml-2 text-gray-700">失物招领</span>
            </label>
          </div>

          <input
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="物品名称"
          />

          <textarea
            value={inputDesc}
            onChange={(e) => setInputDesc(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="详细描述"
            rows={3}
          />

          <button
            onClick={handleSingleMatch}
            disabled={loading || !inputTitle || !inputDesc}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '匹配中...' : '开始匹配'}
          </button>
        </div>
      </div>

      {isLoggedIn && myMatches.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🎯 我的帖子匹配结果</h2>
          <div className="space-y-4">
            {myMatches.map((match) => (
              <Link href={`/items/${match.item_id}`} className="block border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-900 hover:text-purple-600">
                    {match.title}
                  </span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    match.similarity >= 70 ? 'bg-green-100 text-green-700' :
                    match.similarity >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    相似度: {match.similarity}%
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{match.description}</p>
                <p className="text-sm text-gray-400">联系方式: {match.contact}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">🔄 全量匹配</h2>
        <p className="text-gray-500 mb-4">对所有待处理帖子进行交叉匹配</p>
        <button
          onClick={handleBatchMatch}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '匹配中...' : '执行全量匹配'}
        </button>
      </div>

      {matches.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">🎯 全量匹配结果</h2>
          <div className="space-y-6">
            {matches.map((match, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-purple-600">匹配对 #{index + 1}</span>
                  <span className={`text-sm px-3 py-1 rounded ${
                    match.similarity >= 70 ? 'bg-green-100 text-green-700' :
                    match.similarity >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    相似度: {match.similarity}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-semibold text-red-600 mb-2">🔴 寻物</h4>
                    <Link href={`/items/${match.lost_item.id}`} className="font-medium text-gray-800 hover:text-red-600">
                      {match.lost_item.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{match.lost_item.description}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-600 mb-2">🟢 招领</h4>
                    <Link href={`/items/${match.found_item.id}`} className="font-medium text-gray-800 hover:text-green-600">
                      {match.found_item.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{match.found_item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}