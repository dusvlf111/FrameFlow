# FrameFlow ⚡

🌐 Available Languages:
- [English](README.en.md)

FrameFlow는 영화나 드라마를 만화처럼 볼 수 있도록 변환해주는 오픈소스 웹 애플리케이션입니다. 자막 타이밍을 기반으로 핵심 장면을 추출하여 만화책 형태의 PDF로 변환해줍니다.

## 주요 기능

- **영화 → 만화 변환**: 비디오 파일을 업로드하여 만화책 형태로 변환
- **자막 기반 추출**: 자막 파일(`.srt`, `.vtt`)을 기반으로 대화 장면 자동 추출  
- **시간 간격 추출**: 일정한 시간 간격으로 프레임 추출
- **만화 미리보기**: 추출된 프레임과 자막을 만화 형태로 미리보기
- **PDF 다운로드**: 완성된 만화를 PDF 파일로 다운로드

## 시작하기

### 필수 조건

- [Node.js](https://nodejs.org/) (v18 이상 권장)
- [npm](https://www.npmjs.com/) 또는 [yarn](https://yarnpkg.com/)

### 설치

1. **저장소 복제:**

   ```bash
   git clone https://github.com/user/repo.git
   cd repo
   ```

2. **의존성 설치:**

   ```bash
   npm install
   ```

3. **개발 서버 실행:**

   ```bash
   npm run dev
   ```

   이렇게 하면 개발 모드에서 애플리케이션이 시작됩니다. 브라우저에서 [http://localhost:5173](http://localhost:5173)을 열어 확인하세요.

## 사용법

1. **비디오 업로드**: 영화나 드라마 파일을 업로드합니다.
2. **자막 업로드** (선택사항): `.srt` 또는 `.vtt` 자막 파일을 업로드합니다.
3. **변환 설정**: 자막 기반 또는 시간 간격 기반 추출 방식을 선택합니다.
4. **만화 변환**: "Convert to Comic" 버튼을 클릭하여 변환을 시작합니다.
5. **결과 확인**: 생성된 만화 페이지를 미리보고 PDF로 다운로드합니다.

## 프로젝트 구조

```
/
├── public/                  # 공개 자산
├── src/
│   ├── assets/              # 이미지 및 폰트 자산
│   ├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── hooks/               # 사용자 정의 React 훅
│   ├── pages/               # 페이지 컴포넌트
│   ├── services/            # 비즈니스 로직 서비스
│   ├── types/               # TypeScript 타입 정의
│   ├── utils/               # 유틸리티 함수
│   └── main.tsx             # 앱 진입점
├── .eslintrc.cjs            # ESLint 설정
├── .gitignore               # Git ignore 파일
├── index.html               # HTML 템플릿
├── package.json             # 프로젝트 의존성 및 스크립트
├── README.md                # 프로젝트 README
└── vite.config.ts           # Vite 설정
```

## 기여하기

이 프로젝트는 오픈소스입니다! 기여를 환영합니다. 이슈를 등록하거나 풀 리퀘스트를 제출해주세요.

### 개발 환경 설정

```bash
# 저장소 복제
git clone https://github.com/yourusername/frameflow.git
cd frameflow

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 테스트 실행
npm test

# 프로덕션 빌드
npm run build
```

## 라이선스

이 프로젝트는 MIT 라이선스에 따라 라이선스가 부여됩니다.
