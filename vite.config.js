import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite(바이트) 빌드 도구 설정 파일입니다.
export default defineConfig({
  plugins: [
    // React 문법(JSX)을 브라우저가 이해할 수 있는 자바스크립트로 변환해 줍니다.
    react(),
    // Tailwind CSS(미리 만들어진 디자인 클래스 모음)를 사용할 수 있게 연결해 줍니다.
    tailwindcss(),
  ],
})
