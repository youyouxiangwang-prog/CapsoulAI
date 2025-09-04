export default function Login() {
  function loginWithGoogle() {
    console.log("environment variables:", {
      VITE_API_HOST: import.meta.env.VITE_API_HOST,
      VITE_API_PORT: import.meta.env.VITE_API_PORT,
      VITE_API_BASE: import.meta.env.VITE_API_BASE})
    const apiHost = import.meta.env.VITE_API_HOST;
    const apiPort = import.meta.env.VITE_API_PORT;
    window.location.href = `http://${apiHost}:${apiPort}/api/v1/auth/google/login`;
    console.log("Redirecting to:", window.location.href);
  }

  // 登录页美化：渐变背景+卡片+Google图标+动画
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(120deg,#4285F4 0%,#34A853 100%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "48px 40px",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(66,133,244,0.12)",
          minWidth: "340px",
          textAlign: "center",
          animation: "fadeIn 0.8s",
        }}
      >
        {/* 移除 Google 图标，仅保留文字和按钮 */}
        <h1
          style={{
            marginBottom: "24px",
            fontWeight: 700,
            fontSize: "2rem",
            color: "#4285F4",
          }}
        >
          CapsoulAI 登录
        </h1>
        <p
          style={{
            marginBottom: "32px",
            color: "#666",
            fontSize: "1rem",
          }}
        >
          请使用 Google 账号登录以访问全部功能
        </p>
        <button
          style={{
            background: "#4285F4",
            color: "#fff",
            border: "none",
            padding: "14px 32px",
            fontSize: "18px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(66,133,244,0.08)",
            transition: "background 0.2s",
          }}
          onClick={loginWithGoogle}
          onMouseOver={(e) => (e.currentTarget.style.background = "#3367D6")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#4285F4")}
        >
          使用 Google 登录
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

