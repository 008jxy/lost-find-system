'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validateToken, clearAuthStorage } from '../utils/auth';

interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar: string;
  created_at: string;
}

interface UserStats {
  total: number;
  claimed: number;
  resolved: number;
  completed: number;
  pending: number;
}

export default function Profile() {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editUsernameError, setEditUsernameError] = useState('');
  const [editUsernameSuccess, setEditUsernameSuccess] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await validateToken();
      if (!isValid) {
        clearAuthStorage();
        setUsername('');
        setAvatar('');
        setIsValidated(true);
        router.push('/login');
        return;
      }
      
      const storedUsername = localStorage.getItem('username');
      const storedAvatar = localStorage.getItem('avatar');
      if (storedUsername) {
        setUsername(storedUsername);
        setAvatar(storedAvatar || '');
      }
      setIsValidated(true);
      fetchUserInfo();
      fetchUserStats();
    };
    checkAuth();
  }, []);

  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.code === 200) {
        setUserInfo(data.data);
        setAvatar(data.data.avatar);
        localStorage.setItem('avatar', data.data.avatar);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const fetchUserStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/user/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.code === 200) {
        setUserStats(data.data);
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension || '')) {
      setUploadError('仅支持jpg、png、webp格式的图片');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('图片大小不能超过2MB');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/upload/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.code === 200) {
        setAvatar(data.data.avatar);
        localStorage.setItem('avatar', data.data.avatar);
      } else {
        setUploadError(data.msg || '上传失败');
      }
    } catch (error) {
      setUploadError('网络错误，请稍后重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = () => {
    clearAuthStorage();
    window.location.href = '/';
  };

  const handleUsernameEdit = async () => {
    setEditUsernameError('');
    setEditUsernameSuccess('');
    
    if (!editUsername.trim()) {
      setEditUsernameError('用户名不能为空');
      return;
    }
    
    if (editUsername.trim() === username) {
      setEditUsernameError('新用户名与原用户名相同');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: editUsername.trim() }),
      });

      const data = await response.json();
      if (data.code === 200) {
        setUsername(data.data.username);
        localStorage.setItem('username', data.data.username);
        setEditUsernameSuccess('用户名修改成功');
        setIsEditingUsername(false);
        setEditUsername('');
      } else {
        setEditUsernameError(data.msg || '修改失败');
      }
    } catch (error) {
      setEditUsernameError('网络错误，请稍后重试');
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    if (!oldPassword) {
      setPasswordError('请输入原密码');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('请输入新密码');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('新密码长度不能少于6位');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password: newPassword,
          old_password: oldPassword
        }),
      });

      const data = await response.json();
      if (data.code === 200) {
        setPasswordSuccess('密码修改成功');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.msg || '修改失败');
      }
    } catch (error) {
      setPasswordError('网络错误，请稍后重试');
    }
  };

  if (!isValidated) {
    return <div className="text-center py-8">验证中...</div>;
  }

  if (!username) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-md mx-auto">
        <div className="text-6xl mb-6">👤</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">请登录</h2>
        <p className="text-gray-500 mb-6">登录后可以发布帖子、查看通知</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            注册
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl p-8" style={{ backgroundColor: '#e4cfe4' }}>
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={avatar || '/avatar-male.jpg'}
              alt="头像"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-gray-100 transition-colors"
            >
              {uploading ? (
                <svg className="w-4 h-4 text-purple-600 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{username}</h2>
            <p className="text-gray-600">欢迎回来！</p>
            {userInfo && (
              <p className="text-gray-500 text-sm mt-1">{userInfo.email}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
        {uploadError && (
          <div className="mt-4 bg-red-500/30 text-red-700 px-4 py-2 rounded-lg text-sm">
            {uploadError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/profile/posts" className="block bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-purple-600">{userStats?.total ?? 0}</div>
          <div className="text-gray-500">我的帖子</div>
        </Link>
        <Link href="/profile/posts?status=completed" className="block bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-green-600">{userStats?.completed ?? 0}</div>
          <div className="text-gray-500">已完成</div>
        </Link>
        <Link href="/profile/posts?status=pending" className="block bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-yellow-600">{userStats?.pending ?? 0}</div>
          <div className="text-gray-500">待处理</div>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">我的操作</h3>
        </div>
        <div className="flex flex-col gap-4">
          <Link
            href="/post"
            className="flex items-center gap-4 p-4 rounded-lg transition-colors"
            style={{ backgroundColor: '#f5f0f5', }}
          >
            <div className="text-4xl">📝</div>
            <div>
              <div className="font-medium text-gray-800">发布帖子</div>
              <div className="text-sm text-gray-500">发布寻物启事或失物招领</div>
            </div>
          </Link>
          <Link
            href="/notifications"
            className="flex items-center gap-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="text-4xl">🔔</div>
            <div>
              <div className="font-medium text-gray-800">我的通知</div>
              <div className="text-sm text-gray-500">查看AI匹配推送</div>
            </div>
          </Link>
          <Link
            href="/messages"
            className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="text-4xl">💬</div>
            <div>
              <div className="font-medium text-gray-800">我的消息</div>
              <div className="text-sm text-gray-500">查看站内信对话</div>
            </div>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => setIsEditingUsername(!isEditingUsername)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <span className="font-medium text-gray-800">修改用户名</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isEditingUsername ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isEditingUsername && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="输入新用户名"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {editUsernameError && (
              <div className="text-red-500 text-sm">{editUsernameError}</div>
            )}
            {editUsernameSuccess && (
              <div className="text-green-500 text-sm">{editUsernameSuccess}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleUsernameEdit}
                className="px-6 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsEditingUsername(false);
                  setEditUsername('');
                  setEditUsernameError('');
                }}
                className="px-6 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsEditingPassword(!isEditingPassword)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <span className="font-medium text-gray-800">修改密码</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isEditingPassword ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isEditingPassword && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="原密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新密码（至少6位）"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认新密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {passwordError && (
              <div className="text-red-500 text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="text-green-500 text-sm">{passwordSuccess}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handlePasswordChange}
                className="px-6 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsEditingPassword(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="px-6 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}