'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateToken, clearAuthStorage } from '../utils/auth';

interface User {
  id: number;
  username: string;
  avatar: string;
}

interface Conversation {
  item_id: number;
  item_title: string;
  item_category: string;
  other_user: User;
  last_message: string;
  last_time: string;
}

interface Message {
  id: number;
  item_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender?: User;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await validateToken();
      if (!isValid) {
        clearAuthStorage();
        router.push('/login');
      } else {
        setIsLoggedIn(true);
        const userId = localStorage.getItem('user_id');
        if (userId) setCurrentUserId(parseInt(userId));
        fetchConversations();
      }
      setIsValidated(true);
    };
    checkAuth();
  }, [router]);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.code === 200) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('获取会话列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (itemId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/messages/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.code === 200) {
        setMessages(data.messages || []);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('获取消息失败:', err);
    }
  };

  const handleOpenChat = (conv: Conversation) => {
    setActiveChat(conv);
    fetchMessages(conv.item_id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${activeChat.item_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      const data = await response.json();
      if (data.code === 200) {
        setNewMessage('');
        fetchMessages(activeChat.item_id);
        fetchConversations();
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

  const shouldShowTimestamp = (current: Message, prev: Message | null) => {
    if (!prev) return true;
    const diff = new Date(current.created_at).getTime() - new Date(prev.created_at).getTime();
    return diff >= 3 * 60 * 1000;
  };

  if (!isValidated) {
    return <div className="text-center py-8">验证中...</div>;
  }

  if (!isLoggedIn) {
    return <div className="text-center py-8">正在跳转登录页面...</div>;
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-600 mb-2">💬 我的消息</h1>
        <p className="text-gray-500">查看与其他用户的站内信对话</p>
      </div>

      {activeChat ? (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveChat(null);
                  setMessages([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <img
                src={activeChat.other_user?.avatar || '/avatar-male.jpg'}
                alt={activeChat.other_user?.username || '用户'}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900">{activeChat.other_user?.username || '匿名用户'}</p>
                <Link
                  href={`/items/${activeChat.item_id}`}
                  className="text-xs text-purple-600 hover:underline"
                >
                  关于：{activeChat.item_title}
                </Link>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="overflow-y-auto p-4 space-y-3" style={{ minHeight: '300px', maxHeight: '500px' }}>
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
                          <p className="text-sm break-words">{msg.content}</p>
                        </div>
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
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="输入消息..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </form>
        </div>
      ) : (
        conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">暂无消息</h2>
            <p className="text-gray-500">在帖子详情页点击"联系发布者"即可开始对话</p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              去看看帖子
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {conversations.map((conv, idx) => (
              <button
                key={`${conv.item_id}-${conv.other_user?.id}`}
                onClick={() => handleOpenChat(conv)}
                className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left ${
                  idx > 0 ? 'border-t' : ''
                }`}
              >
                <img
                  src={conv.other_user?.avatar || '/avatar-male.jpg'}
                  alt={conv.other_user?.username || '用户'}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900 truncate">
                      {conv.other_user?.username || '匿名用户'}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(conv.last_time)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      conv.item_category === 'lost' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {conv.item_category === 'lost' ? '寻物' : '招领'}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{conv.item_title}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
