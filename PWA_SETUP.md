# 런하우스 PWA 설정 완료

## 🎉 설정된 기능들

### ✅ 완료된 PWA 기능
- **앱 설치 가능**: Android/iOS에서 홈 화면에 추가 가능
- **오프라인 지원**: 기본 페이지들이 캐시되어 오프라인에서도 접근 가능
- **푸시 알림 준비**: 푸시 알림 기본 구조 설정 완료
- **앱 아이콘**: 다양한 사이즈의 아이콘 설정 완료
- **테마 색상**: #3f82f6 (파란색) 적용

### 📱 설치 방법
1. **Android Chrome**: 주소창 옆 "설치" 버튼 클릭
2. **iOS Safari**: 공유 버튼 → "홈 화면에 추가"
3. **데스크톱**: 주소창 옆 설치 아이콘 클릭

## 🔧 추가 설정 필요사항

### 1. 푸시 알림 완전 활성화
푸시 알림을 사용하려면 VAPID 키가 필요합니다:

```bash
# VAPID 키 생성 (web-push 라이브러리 사용)
npm install -g web-push
web-push generate-vapid-keys
```

생성된 키를 `.env.local` 파일에 추가:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

### 2. 푸시 알림 사용법

컴포넌트에서 푸시 알림 초기화:
```tsx
import { initializePushNotifications, showLocalNotification } from '@/lib/push-notifications';

// 컴포넌트 내에서
useEffect(() => {
    initializePushNotifications();
}, []);

// 테스트 알림 보내기
const sendTestNotification = () => {
    showLocalNotification('테스트', '알림이 정상 작동합니다!');
};
```

### 3. 앱 설치 프롬프트 사용법

레이아웃에 설치 프롬프트 컴포넌트 추가:
```tsx
import InstallPrompt from '@/components/atoms/InstallPrompt';

// layout.tsx 또는 원하는 페이지에서
<InstallPrompt />
```

## 📋 파일 구조

```
public/
├── manifest.json          # PWA 매니페스트
├── sw.js                  # Service Worker
├── android-chrome-*.png   # Android 아이콘
├── apple-touch-icon.png   # iOS 아이콘
└── favicon-*.png          # 브라우저 아이콘

lib/
└── push-notifications.ts  # 푸시 알림 유틸리티

components/atoms/
└── InstallPrompt.tsx      # 앱 설치 프롬프트
```

## 🧪 테스트 방법

1. **개발 서버 실행**: `npm run dev`
2. **HTTPS 환경**: PWA는 HTTPS에서만 완전 작동
3. **Chrome DevTools**: Application 탭에서 PWA 상태 확인
4. **Lighthouse**: PWA 점수 확인

## 🚀 배포 시 주의사항

1. **HTTPS 필수**: PWA는 HTTPS 환경에서만 작동
2. **Service Worker 캐시**: 업데이트 시 캐시 버전 변경 필요
3. **아이콘 최적화**: 다양한 디바이스 대응을 위한 아이콘 사이즈 확인

## 📱 지원 브라우저

- ✅ Chrome (Android/Desktop)
- ✅ Safari (iOS/macOS) 
- ✅ Edge (Windows)
- ✅ Firefox (Android/Desktop)
- ✅ Samsung Internet

---

**런하우스 PWA가 성공적으로 설정되었습니다! 🎉** 