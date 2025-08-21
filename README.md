# Rain - AI 기상 레이더 예측 시스템

AI 기반 단기 강수 및 국지성 호우 예측을 위한 데스크톱 애플리케이션입니다.

## 프로젝트 개요

기상레이더 데이터를 활용하여 0-6시간 이내의 초단기 강수 예측을 수행하는 시스템입니다. 머신러닝/딥러닝 기술을 활용하여 국지성 호우 예측 정확도를 향상시키는 것이 목적입니다.

## 주요 기능

- 기상레이더 데이터 실시간 수집 및 분석
- AI 모델 기반 강수량 예측
- 예측 결과 시각화 및 지도 표시
- 사용자 설정 관리


## 프로젝트 구조

```
rain/
├── main.js                    # Electron 메인 프로세스
├── package.json               # 프로젝트 설정 및 의존성
├── renderer/                  # 프론트엔드 코드
│   ├── index.html            # 메인 UI
│   ├── renderer.js           # 렌더러 프로세스 로직
│   └── style.css             # 스타일시트
├── assets/                    # 리소스 파일
│   ├── backend/              # Python 백엔드 실행파일
│   │   ├── app.exe          # 패키징된 Python 애플리케이션
│   │   └── _internal/       # 의존성 라이브러리
│   ├── icon.ico             # Windows 애플리케이션 아이콘
│   └── icon.png             # 일반 아이콘
├── dist/                      # 빌드된 애플리케이션
└── node_modules/              # Node.js 의존성 패키지
```

## Assets 폴더 구성 가이드

### `/assets/backend/`
- **app.exe**: Python으로 개발된 AI 모델 실행파일 (PyInstaller로 패키징)
- **_internal/**: Python 실행파일의 의존성 라이브러리들
- 포함되어야 할 구성요소:
  - AI 모델 파일 (.pkl, .h5, .pt 등)
  - 데이터 전처리 스크립트
  - 기상청 API 연동 모듈
  - 설정 파일 (config.ini, settings.json 등)

### `/assets/icons/`
- **icon.ico**: Windows 실행파일 아이콘 (256x256 권장)
- **icon.png**: 일반 PNG 아이콘 (512x512 권장)
- 추가 권장 아이콘:
  - **icon-16x16.png**: 작은 크기 아이콘
  - **icon-32x32.png**: 중간 크기 아이콘
  - **icon-256x256.png**: 고해상도 아이콘


## 설치 및 실행

### 개발 환경 설정

1. **Node.js 설치** (v14 이상)
2. **의존성 설치**
   ```bash
   npm install
   ```

### 애플리케이션 실행

```bash
# 개발 모드 실행
npm start

# 빌드
npm run build

# 배포용 패키징
npm run dist
```

## 주요 구성 요소 설명

### main.js
- Electron 메인 프로세스 관리
- 설정 파일(config.json) 로드/저장
- Python 백엔드 프로세스 실행
- IPC 통신 관리
- 윈도우 생성 및 관리

### renderer/
- **index.html**: 메인 사용자 인터페이스
- **renderer.js**: 
  - 기상 데이터 시각화
  - 사용자 입력 처리
  - 백엔드와의 통신
  - 예측 결과 표시
- **style.css**: UI 스타일링
