'use client';

import { useState } from 'react';

interface MatchItem {
  item_id: number;
  title: string;
  description: string;
  category: string;
  contact: string;
  similarity: number;
  status: string;
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
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [inputCategory, setInputCategory] = useState<'lost' | 'found'>('lost');
  const [singleMatches, setSingleMatches] = useState<MatchItem[]>([]);

  const handleBatchMatch = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/match/all');
      const data = await response.json();
      setMatches(data.matches || []);
      setSingleMatches([]);
    } catch (err) {
      console.error('批量匹配失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleMatch = async () => {
    if (!inputTitle || !inputDesc) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: inputTitle,
          description: inputDesc,
          category: inputCategory,
        }),
      });
      const data = await response.json();
      setSingleMatches(data.matches || []);
      setMatches([]);
    } catch (err) {
      console.error('匹配失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">🤖 AI智能匹配</h1>
        <p className="text-gray-500">基于TF-IDF和余弦相似度算法，自动匹配相似帖子</p>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
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
                className="w-4 h-4 text-blue-600"
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
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">失物招领</span>
            </label>
          </div>

          <input
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="物品名称"
          />

          <textarea
            value={inputDesc}
            onChange={(e) => setInputDesc(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="详细描述"
            rows={3}
          />

          <button
            onClick={handleSingleMatch}
            disabled={loading || !inputTitle || !inputDesc}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '匹配中...' : '开始匹配'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🔄 全量匹配</h2>
        <p className="text-gray-500 mb-4">对所有现有帖子进行交叉匹配</p>
        <button
          onClick={handleBatchMatch}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '匹配中...' : '执行全量匹配'}
        </button>
      </div>

      {singleMatches.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 匹配结果</h2>
          <div className="space-y-4">
            {singleMatches.map((match) => (
              <div key={match.item_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{match.title}</h3>
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
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 全量匹配结果</h2>
          <div className="space-y-6">
            {matches.map((match, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-blue-600">匹配对 #{index + 1}</span>
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
                    <p className="font-medium">{match.lost_item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{match.lost_item.description}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-600 mb-2">🟢 招领</h4>
                    <p className="font-medium">{match.found_item.title}</p>
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