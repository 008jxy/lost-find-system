'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import API_BASE_URL from '../../utils/api';

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
  found_time: string;
  found_location: string;
  image: string;
  status: 'pending' | 'claimed' | 'resolved';
  created_at: string;
  user?: User;
}

interface Message {
  id: number;
  item_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  image?: string;
  read: boolean;
  recalled: boolean;
  created_at: string;
  sender?: User;
}

const ITEM_TYPES: Record<string, string> = {
  id_card: '证件卡片',
  electronics: '电子设备',
  stationery: '学习用品',
  daily: '生活日用',
  sports: '体育器材',
  other: '其他'
};

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
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const response = await fetch(`${API_BASE_URL}/api/items/${id}`);
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
      const response = await fetch(`${API_BASE_URL}/api/items/${item.id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/items/${item.id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/items/${item.id}`, {
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

  const fetchMessages = async () => {
    if (!item) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.code === 200) {
        setMessages(data.messages || []);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        await fetch(`${API_BASE_URL}/api/messages/${item.id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('获取消息失败:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('请选择 jpg、png 或 webp 格式的图片');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过 2MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !imageFile || !item) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setSendingMessage(true);
    try {
      const formData = new FormData();
      if (newMessage.trim()) {
        formData.append('content', newMessage.trim());
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/messages/${item.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.code === 200) {
        setNewMessage('');
        setImageFile(null);
        setPreviewImage(null);
        fetchMessages();
      }
    } catch (err) {
      console.error('发送消息失败:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + 
             date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const canRecall = (createdAt: string) => {
    const now = new Date();
    const msgDate = new Date(createdAt);
    const diffSeconds = (now.getTime() - msgDate.getTime()) / 1000;
    return diffSeconds <= 60;
  };

  const handleRecall = async (msgId: number) => {
    if (!confirm('确定要撤回这条消息吗？')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${msgId}/recall`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.code === 200) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, recalled: true } : m));
      } else {
        alert(data.msg || '撤回失败');
      }
    } catch (err) {
      console.error('撤回消息失败:', err);
      alert('撤回失败，请重试');
    }
  };

  const shouldShowTimestamp = (current: Message, prev: Message | null) => {
    if (!prev) return true;
    const diff = new Date(current.created_at).getTime() - new Date(prev.created_at).getTime();
    return diff >= 3 * 60 * 1000;
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
  const nowDate = new Date();
  const offset = nowDate.getTimezoneOffset();
  const localNow = new Date(nowDate.getTime() - offset * 60 * 1000);
  const now = localNow.toISOString().slice(0, 16);

  return (
    <div className="max-w-4xl mx-auto lg:max-w-5xl">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-4 p-4 border-b">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">返回上一页</span>
          </button>
        </div>
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
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
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
                <span className="text-sm px-2 py-1 rounded bg-blue-50 text-blue-600">
                  {item.campus === 'kangmei' ? '康美校区' : '美林校区'}
                </span>
                <span className="text-sm px-2 py-1 rounded bg-purple-50 text-purple-600">
                  {ITEM_TYPES[item.item_type] || item.item_type}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img
                    src={item.user?.avatar || '/avatar-male.jpg'}
                    alt={item.user?.username || '用户'}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-500">{item.user?.username || '匿名用户'}</span>
                </div>
                <p className="text-sm text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
              </div>
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

              {!isOwner && currentUserId && (
                <div className="flex justify-center pt-6 border-t">
                  <button
                    onClick={() => {
                      setShowChat(true);
                      fetchMessages();
                    }}
                    className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    联系发布者
                  </button>
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

      {showChat && item && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowChat(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-3">
                <img
                  src={item.user?.avatar || '/avatar-male.jpg'}
                  alt={item.user?.username || '用户'}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900">{item.user?.username || '匿名用户'}</span>
                  <div className="mt-1">
                    <Link
                      href={`/items/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs hover:bg-purple-100 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.category === 'lost' ? 'bg-red-500' : 'bg-green-500'
                      }`}></span>
                      {item.title}
                    </Link>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  还没有消息，发送第一条消息吧！
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUserId;
                  const showTime = shouldShowTimestamp(msg, idx > 0 ? messages[idx - 1] : null);
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="text-center text-xs text-gray-400 my-2">
                          {formatTime(msg.created_at)}
                        </div>
                      )}
                      <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <img
                          src={msg.sender?.avatar || '/avatar-male.jpg'}
                          alt={msg.sender?.username || '用户'}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className={`max-w-[70%] ${isMe ? 'items-end' : ''}`}>
                          <p className={`text-xs text-gray-400 mb-1 ${isMe ? 'text-right' : ''}`}>
                            {isMe ? '我' : msg.sender?.username}
                          </p>
                          <div className={`px-3 py-2 rounded-lg ${
                            isMe ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {msg.recalled ? (
                              <p className="text-sm text-gray-500">消息已撤回</p>
                            ) : (
                              <>
                                {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                                {msg.image && (
                                  <img
                                    src={msg.image}
                                    alt="消息图片"
                                    className={`max-w-[150px] h-auto rounded cursor-pointer hover:opacity-80 transition-opacity ${msg.content ? 'mt-2' : ''}`}
                                    onClick={() => {
                                      const modal = document.createElement('div');
                                      modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
                                      modal.innerHTML = `
                                        <img src="${msg.image}" alt="预览" className="max-w-[90%] max-h-[90%] object-contain" />
                                      `;
                                      modal.onclick = () => modal.remove();
                                      document.body.appendChild(modal);
                                    }}
                                  />
                                )}
                              </>
                            )}
                          </div>
                          {isMe && !msg.recalled && (
                            <div className={`flex items-center gap-2 mt-0.5 ${isMe ? 'justify-end' : ''}`}>
                              <span className={`text-xs ${msg.read ? 'text-gray-400' : 'text-gray-500'}`}>
                                {msg.read ? '已读' : '未读'}
                              </span>
                              {canRecall(msg.created_at) && (
                                <button
                                  onClick={() => handleRecall(msg.id)}
                                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  撤回
                                </button>
                              )}
                            </div>
                          )}
                          {isMe && msg.recalled && (
                            <span className="text-xs text-gray-400 mt-0.5">已撤回</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
              <label className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              </label>
              {previewImage && (
                <div className="relative w-12 h-12 flex-shrink-0">
                  <img src={previewImage} alt="预览" className="w-full h-full object-cover rounded" />
                  <button type="button" onClick={() => { setImageFile(null); setPreviewImage(null); }} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                </div>
              )}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={(!newMessage.trim() && !imageFile) || sendingMessage}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                发送
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}