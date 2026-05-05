# 단체 사진 합성 운영 정책

- 작성일: 2026-05-05
- 대상 페이지: `/admin2/photo-composite`
- 관련 설계: [`docs/plans/2026-05-05-photo-composite-design.md`](../plans/2026-05-05-photo-composite-design.md)
- 관련 실행 계획: [`docs/plans/2026-05-05-photo-composite-plan.md`](../plans/2026-05-05-photo-composite-plan.md)

---

## 1. 기능 정체성

운영진이 모임/정모 단체 사진에 크루 로고(또는 즉석 PNG)를 합성해 다운로드하는 도구. 인스타·카톡 공유용 워터마크. **결과물은 서버에 저장되지 않으며 클라이언트 메모리에서만 처리한다.**

## 2. 접근 권한

| 항목 | 정책 |
|---|---|
| 페이지 진입 | 운영진(CREW_MANAGER 이상) 또는 마스터 |
| 라우팅 가드 | `/admin2/*` 공통 가드 |
| 데이터 노출 | 자기 크루의 로고 URL 1건만 (RLS) |

운영진이 아닌 사용자는 메뉴에 노출되지 않으며, 직접 URL 접근 시 admin2 가드가 차단한다.

## 3. 입력 정책

### 3.1 단체 사진

| 항목 | 값 |
|---|---|
| 허용 MIME | `image/jpeg`, `image/png`, `image/webp` |
| 차단 MIME | `image/heic`, `image/heif` (디코드 미지원) |
| 최대 크기 | 20MB |
| 편집 해상도 | long-edge 1600px (자동 다운스케일) |
| EXIF 회전 | `imageOrientation: 'from-image'`로 자동 보정 |

**HEIC 차단 사유:** 브라우저 `createImageBitmap`이 HEIC를 디코드하지 못하므로 사용자에게 친절한 안내 메시지로 거부한다. iOS 사용자는 사진 앱 설정 → "고효율 → 호환성"으로 변경하거나 변환 후 업로드.

### 3.2 로고 (즉석 업로드 모드)

| 항목 | 값 |
|---|---|
| 허용 MIME | `image/png` 만 |
| 최대 크기 | 5MB |
| 메모리 처리 | `URL.createObjectURL` → 사용 후 `revokeObjectURL` |

**PNG만 허용 사유:** 투명 배경이 보장되어야 사진 위에 자연스럽게 얹힌다. JPEG는 항상 불투명 배경이 같이 그려진다.

### 3.3 크루 로고 (기본 모드)

`crews.profile_image_url`을 직접 fetch해 `ImageBitmap`으로 디코드. CORS는 Supabase public bucket이라 기본 허용. CORS 정책이 변경되면 즉석 PNG 업로드로 폴백.

## 4. 출력 정책

| 항목 | 값 |
|---|---|
| 포맷 | JPEG q=0.92 |
| 해상도 | long-edge 2560px |
| 파일명 | `<crew>-YYYYMMDD.jpg` |
| 저장 경로 | iOS Safari = Web Share API (공유 시트 → "이미지 저장") / Android = `<a download>` / 데스크톱 = 다운로드 |
| 서버 저장 | **없음** (개인정보 처리 범위 확장 0) |

## 5. 합성 모드 정책

### 5.1 프리셋 모드 (기본)

5개 위치(↖ ↗ ◯ ↙ ↘) × 3개 크기(S 8% / M 12% / L 18%) × 투명도(10~100%). 사진 long-edge 기준 비례.

### 5.2 자유 배치 모드

`react-konva` Transformer로 드래그 / 비율잠금 리사이즈 / 회전 / 멀티터치 핀치+회전. 로고가 사진 영역의 50% 이상을 유지하도록 자동 클램프(회전은 미적용 — 알려진 한계).

| 액션 | 동작 |
|---|---|
| 직접 조정 진입 | 현재 프리셋 좌표를 시드로 자유 모드 시작 |
| 원위치 리셋 | 현재 프리셋 좌표로 복원 (Undo 대체) |
| 프리셋으로 복귀 | 자유 모드 종료, 프리셋 모드 재진입 |

## 6. 보안 / 개인정보

- 합성 결과물은 **서버에 저장되지 않으며**, 사용자가 다운로드하거나 공유 시트로 내보낸 시점에 책임이 사용자에게 이전된다.
- `URL.createObjectURL`로 만든 메모리 URL은 컴포넌트 unmount 시 항상 `revokeObjectURL`로 회수.
- `ImageBitmap`은 교체/언마운트 시 `close()` 호출. iOS Safari에서는 GPU 텍스처 즉시 회수 위해 export 후 `canvas.width = canvas.height = 0`으로 dispose.
- 로고 URL은 기존 `crews` RLS 정책 안에서만 조회되므로 별도 데이터 노출면 없음.

## 7. 알려진 한계

| 항목 | 영향 | 우회 |
|---|---|---|
| HEIC 디코드 미지원 | iOS 구버전 사용자 사진 업로드 불가 | 사진 앱 설정 변경 또는 외부 변환 후 업로드 |
| 회전된 로고의 클램프 미적용 | 45도 회전 시 사진 영역 밖으로 더 빠질 수 있음 | "원위치 리셋"으로 복귀 |
| `react-konva` 첫 진입 지연 | 운영진 첫 진입 시 ~140KB 번들 추가 로드 | `next/dynamic({ ssr: false })`로 일반 사용자 첫 로드는 영향 0 |
| Web Share API 미지원 환경 | Android 일부 / 데스크톱 | `<a download>`로 자동 폴백 |

## 8. 운영 가이드

### 8.1 일상 사용

1. `/admin2/menu` → "단체 사진 합성" 진입
2. 단체 사진 선택 (앨범 / 카메라)
3. 로고 소스: 크루 로고 / PNG 업로드
4. 프리셋 모드에서 위치·크기·투명도 1탭 조정 (90% 케이스)
5. 필요 시 "직접 조정"으로 자유 배치
6. "저장 / 공유" 1탭

### 8.2 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| "HEIC 형식은 아직 지원하지 않아요" | iOS HEIC | 외부 변환 후 재업로드 |
| "사진 크기는 20MB 이하여야 해요" | 4K 원본 그대로 | 갤러리 앱에서 압축 후 재업로드 |
| 크루 로고가 안 떠요 | `crews.profile_image_url` 미설정 | `/admin2/crew-edit`에서 로고 업로드 |
| 저장 후 결과물 깨짐 | 매우 드물게 toBlob 실패 | 다른 사진/로고로 재시도 |

## 9. 변경 시 주의사항

- 새로운 출력 포맷 추가 시 `_lib/exportImage.ts`만 수정. 도메인 함수(`다운스케일치수계산`, `프리셋좌표산출`, `클램프적용하기`)는 출력 포맷과 무관.
- `EDIT_LONG_EDGE`(편집 1600px) / `OUTPUT_LONG_EDGE`(출력 2560px)는 `_components/PhotoComposer.tsx` / `_components/SaveButton.tsx` 상수로 관리.
- Konva 메이저 버전 업그레이드 시 `next.config.js`의 `canvas` externals 설정 재확인.

## 10. 향후 과제 (Out of Scope)

| 항목 | 사유 |
|---|---|
| 멀티 로고 z-order | 단체사진 2개 이상 로고 케이스 드물고 모바일 UI 복잡 (YAGNI) |
| Undo/Redo | "원위치 리셋" 1버튼으로 충분 (YAGNI) |
| 자동 워터마크/타임스탬프 | 프리셋 위치 자체가 워터마크 역할 |
| 사진 크롭 단계 | OS 갤러리에서 가능 |
| 결과물 갤러리 보관 | 다운로드 전용 합의 (개인정보 범위 확장 회피) |
| HEIC 클라이언트 디코드 | `libheif-js` 추가 시 ~600KB 번들 → 트레이드오프 큼 |

## 11. 변경 이력

| 날짜 | 변경 | 사유 |
|---|---|---|
| 2026-05-05 | 초안 작성 | 단체 사진 합성 기능 출시 |
