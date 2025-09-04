import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    hmr: {
      // 强制 WebSocket 使用标准的 80 端口
      // 这样客户端就不会去连接 5175 了
      clientPort: 80,
    },
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:8091',
        changeOrigin: true,
      }
    }
  }
})
