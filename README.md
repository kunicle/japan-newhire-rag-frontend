# 일본 신입사원 규정 안내 RAG - Frontend

일본 신입사원을 위한 사내 규정 안내 RAG 서비스의 프론트엔드입니다.

## 기술 구성

- React
- TypeScript
- Vite
- Node.js 22

## 요구 환경

Node.js 22를 사용합니다.

버전 확인:

    node -v
    npm -v

nvm 사용 시:

    nvm use

## 설치

    npm install

## 개발 서버 실행

    npm run dev

기본 접속 주소:

    http://localhost:5173

## 프로덕션 빌드

    npm run build

## 환경변수

`.env.example`을 참고해 로컬 `.env` 파일을 생성합니다.

    cp .env.example .env

기본 백엔드 주소:

    VITE_API_BASE_URL=http://localhost:8080

실제 API 키, 비밀번호, 토큰은 GitHub에 올리지 않습니다.
