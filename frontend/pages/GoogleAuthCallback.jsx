// File: src/pages/GoogleAuthCallback.jsx

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function GoogleAuthCallback() {
  const location = useLocation();
  const [error, setError] = useState(null);

  useEffect(() => {
    const processAuth = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');

      if (code) {
        try {
          // 【核心】使用相对路径发起 fetch 请求，让 Vite 代理处理
          const response = await fetch(`/api/v1/auth/google/callback?code=${code}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Server returned an error.');
          }

          const data = await response.json();
          const accessToken = data.access_token;

          if (accessToken) {
            // 成功获取到 token！
            localStorage.setItem('access_token', accessToken);
            // 登录成功，强制刷新并跳转到主页，确保整个 App 状态更新
            window.location.href = '/Memories'; 
          } else {
            throw new Error('Token not found in server response.');
          }

        } catch (err) {
          console.error("Auth callback failed:", err);
          setError(err.message);
        }
      } else {
        setError("No authorization code provided by Google.");
      }
    };

    processAuth();
  }, [location]); // 依赖 location 确保只运行一次

  if (error) {
    return (
      <div>
        <h1>Login Failed</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <a href="/login">Try Login Again</a>
      </div>
    );
  }

  return <div>Finalizing login... Please wait.</div>;
}