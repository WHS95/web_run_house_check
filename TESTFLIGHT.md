# TestFlight 업로드 — 런하우스 iOS 셸

최종 갱신 2026-09-02. **⏳ IPA 빌드 완료 · 앱 레코드 생성 대기 중 (업로드 미실행).**

참조: `~/Desktop/서우혁/mini-game/prototype-v3/ios-app/TESTFLIGHT.md` (Chop King, 동일 팀·동일 API 키로 출시 완료된 사례). 아래 함정 목록은 대부분 거기서 이미 밟은 것이다.

---

## 이 앱의 성격 — 원격 로드 셸

Next.js App Router(RSC/Server Actions)는 정적 export가 불가능하다. 그래서 웹 자산을 번들하지 않고
`server.url`로 **배포된 Vercel 프로덕션을 원격 로드**한다.

| 함의 | 내용 |
|---|---|
| 웹 코드 변경 | **재아카이브 불필요.** Vercel 배포만 하면 앱에 즉시 반영된다 |
| 재아카이브가 필요한 때 | `capacitor.config.ts`, `Info.plist`, 아이콘, 버전 번호를 바꿀 때만 |
| `webDir` | `capacitor-shell/` — 네트워크 실패 시 폴백 화면. 실제로는 거의 안 보인다 |
| Service Worker | **동작 안 함.** WKWebView는 SW를 실행하지 않는다 → 오프라인 캐시·웹푸시(FCM) 비활성 |
| 네이티브 푸시 | 필요하면 `@capacitor/push-notifications` + APNs로 별도 구현 |

---

## 확정된 식별자 (변경 금지)

| 항목 | 값 |
|---|---|
| 번들 ID | `com.runhouse.app` (ASC 리소스 ID `CFURA98ZY5`) |
| Team ID | `NH5Y9D5FYH` |
| 배포 인증서 | `iPhone Distribution: WooHyeok Seo (NH5Y9D5FYH)` / ID `WU74ZK843W` / 2027-09-02 만료 |
| 프로비저닝 프로파일 | `IOS_APP_STORE-20260902` / UUID `a653af28-04a4-4871-adec-bc3fee5a5f70` |
| ASC API 키 | **공개 저장소라 기재하지 않음.** `asc auth status` 로 Key ID 확인, Issuer 는 App Store Connect → 통합 → App Store Connect API 에서 확인 |
| ASC 계정 보유자 | `asc users list` 로 확인할 것. **커밋 작성자 이메일과 다른 계정이다** — 아래 함정 8 참조 |
| 프로덕션 URL | `https://web-run-house-check.vercel.app` |

---

## 현재 상태 (2026-09-02)

| 단계 | 결과 |
|---|---|
| Capacitor iOS 프로젝트 | ✅ `ios/` (SPM 기반, CocoaPods 미사용) |
| 번들 ID 등록 | ✅ `asc bundle-ids create` |
| 인증서 + 프로파일 | ✅ 생성·임포트 완료 |
| 아카이브 / IPA | ✅ `.asc/artifacts/export/App.ipa` (734KB), `-validate-for-store` 통과 |
| 버전 / 빌드 | `1.0` / `1` |
| **앱 레코드** | ❌ **미생성 — 유일한 블로커** |
| 업로드 | ⏳ 앱 레코드 대기 |

---

## 🔴 남은 단계 — 앱 레코드 생성 (사람만 가능)

**앱 생성은 공개 App Store Connect API에 없다.** `asc web apps create`는 Apple ID 비밀번호 + 2FA
웹 세션을 요구한다. 앱이 없으면 `altool`이 `Cannot determine the Apple ID from Bundle ID`로
**첫 단계에서** 막힌다.

```bash
asc web apps create --name "런하우스" --bundle-id "com.runhouse.app" \
  --sku "runhouse-ios-01" --primary-locale ko --apple-id "<ASC 계정 보유자 이메일>"
```

> ⚠️ `--apple-id`는 **ASC 사용자로 등록된 계정**이어야 한다.
> `asc users list` 로 확인할 것 — 이 팀에는 계정이 하나뿐이고, **커밋 작성자 이메일과 다르다.**

> ⚠️ 출력의 **초기 버전 문자열**(`--version`, 기본 `1.0`)을 확인할 것. 아래 업로드/배포 단계의
> 버전과 일치해야 한다.

---

## 앱 레코드 생성 후 — 업로드 및 TestFlight 배포

```bash
cd ~/Desktop/서우혁/런하우스/web_run_house_check
security unlock-keychain -p "$(cat signing/.kcpass)" build.keychain

# zsh에서는 플래그를 변수에 넣지 말고 그대로 적을 것 (아래 함정 참조)
xcrun altool --validate-app -f .asc/artifacts/export/App.ipa -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
xcrun altool --upload-app -f .asc/artifacts/export/App.ipa -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

# 빌드 처리 대기 (약 2분). 빌드 번호로 행을 좁혀서 확인할 것
asc builds list --app <APP_ID> --output table | grep "│ 1 "

asc testflight groups create --app <APP_ID> --name "Internal" --internal
asc builds add-groups --build-id "<BUILD>" --group "<GROUP>"
asc testflight testers add --app <APP_ID> --group "<GROUP>" \
  --email "<ASC 계정 보유자 이메일>" --first-name "Woohyeok" --last-name "Seo"
asc builds test-notes create --build-id "<BUILD>" --locale ko \
  --whats-new "런하우스 웹앱 iOS 셸 첫 빌드. 카카오 로그인부터 확인해주세요."
```

빌드 후에는 키체인 검색 순서를 되돌린다:

```bash
security list-keychains -d user -s login.keychain-db
```

---

## 🚨 설치 후 가장 먼저 확인할 것 — 카카오 로그인

카카오는 임베디드 WKWebView에서 OAuth를 거부할 수 있다. **앱을 열자마자 이것부터 테스트한다.**

- `lib/auth.ts`의 `redirectTo`가 `window.location.origin` 기준이라, `server.url`이 프로덕션과
  같은 한 리다이렉트는 웹뷰 안으로 되돌아온다. `allowNavigation`에 `*.kakao.com`·`*.supabase.co`를
  넣어둔 것도 그 때문이다.
- 그래도 카카오가 거부하면 **설정 문제가 아니다.** `@capacitor/browser`(SFSafariViewController)로
  OAuth를 띄우고 커스텀 URL 스킴으로 되받는 구조로 바꿔야 한다 — `redirectTo`를 origin에서
  떼어내는 코드 변경이 따른다.

---

## 밟은 함정 (반복하지 말 것)

1. **`openssl pkcs12 -legacy`는 macOS에서 못 쓴다.** 시스템 openssl은 LibreSSL이라 그 플래그가
   없다. LibreSSL은 기본이 이미 레거시 알고리즘이라 **그냥 빼면 된다.**
   (`ios-app-store-submit` 스킬의 `-legacy`는 brew openssl 기준)
2. **서명 플래그를 `xcodebuild` 전역 인자로 넘기지 않는다.** 전역으로 주면 SPM 프레임워크
   타겟까지 프로파일을 요구받아 전부 깨진다. `CODE_SIGN_STYLE`/`CODE_SIGN_IDENTITY`/
   `PROVISIONING_PROFILE_SPECIFIER`/`DEVELOPMENT_TEAM`은 `project.pbxproj`의
   **App 타겟 Release 블록 안에만** 넣었다 (`PRODUCT_BUNDLE_IDENTIFIER`가 같은 블록에 있는 쪽).
3. **`CODE_SIGN_IDENTITY`는 전체 문자열을 쓴다.** 접두사(`"iPhone Distribution"`)만 쓰면
   login.keychain의 다른 앱 인증서와 비결정적으로 매칭될 수 있다. 이 머신엔
   `com.woohyeok.chopking`, `com.dmpforme.closetai` 등의 인증서가 있다.
4. **zsh는 변수를 단어 분리하지 않는다.** `KEY="--apiKey ... --apiIssuer ..."` + `altool $KEY`는
   bash 기준이다. zsh에서는 통째로 인자 하나가 되어
   `Either JWT (--api-issuer and --api-key) ... is required (30)`로 죽는다. 플래그를 그대로 적을 것.
5. **`altool`은 `asc auth` 저장소를 안 본다.** `~/.appstoreconnect/private_keys/`에 `.p8`이 따로
   있어야 한다 (이 머신엔 이미 있음).
6. **빌드 처리 폴링에서 `grep VALID`는 항상 즉시 참이다.** 다른 빌드가 이미 VALID라서 목록
   전체를 grep하면 방금 올린 빌드가 나타나기도 전에 루프를 빠져나온다. 빌드 번호로 행을 좁힐 것.
7. **TestFlight 테스트 노트에 이모지 금지.** `Text for whatsNew contains invalid characters`로 거부된다.
8. **내부 테스터는 ASC 사용자로 등록된 계정만 된다.** 등록되지 않은 주소로 시도하면
   `Tester(s) cannot be assigned`로 실패하는데 원인이 드러나지 않는다.
   **iPhone의 TestFlight 앱에도 그 계정으로 로그인해야 빌드가 보인다.**
9. **`security find-generic-password -g`는 GUI 잠금 해제를 요구해 헤드리스에서 멈춘다.** 쓰지 말 것.
10. **한 번 출시된 버전의 트레인은 닫힌다.** 출시 후 첫 TestFlight 빌드는
    `CURRENT_PROJECT_VERSION`뿐 아니라 `MARKETING_VERSION`도 올려야 한다
    (`project.pbxproj`에 블록 2개씩 = 4줄).

---

## 재현 절차 (인증서·아카이브를 처음부터 다시 만들 때)

`signing/`, `.asc/`는 gitignore돼 있다. `ExportOptions.plist`만 레포 루트에 사본으로 추적한다.

```bash
cd ~/Desktop/서우혁/런하우스/web_run_house_check
KC_PASS="build-$(date +%s)"; echo "$KC_PASS" > signing/.kcpass; chmod 600 signing/.kcpass
security create-keychain -p "$KC_PASS" build.keychain
security unlock-keychain -p "$KC_PASS" build.keychain
security set-keychain-settings -lut 21600 build.keychain
security list-keychains -d user -s build.keychain login.keychain-db

asc certificates create --certificate-type IOS_DISTRIBUTION --generate-csr \
  --key-out ./signing/dist.key --csr-out ./signing/dist.csr \
  --common-name "RunHouse Distribution" --email "<연락용 이메일>"
asc signing fetch --bundle-id "com.runhouse.app" --profile-type IOS_APP_STORE \
  --certificate-type IOS_DISTRIBUTION --create-missing --output ./signing

openssl x509 -inform DER -in signing/<serial>.cer -out signing/dist.pem
openssl pkcs12 -export -inkey signing/dist.key -in signing/dist.pem \
  -out signing/dist.p12 -passout pass:temp
security import signing/dist.p12 -k build.keychain -P temp \
  -T /usr/bin/codesign -T /usr/bin/security
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KC_PASS" build.keychain

UUID=$(security cms -D -i signing/<profile>.mobileprovision | plutil -extract UUID raw -o - -)
cp signing/<profile>.mobileprovision \
  ~/Library/MobileDevice/"Provisioning Profiles"/"$UUID.mobileprovision"

npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath .asc/artifacts/App.xcarchive \
  archive OTHER_CODE_SIGN_FLAGS="--keychain build.keychain"
xcodebuild -exportArchive -archivePath .asc/artifacts/App.xcarchive \
  -exportPath .asc/artifacts/export -exportOptionsPlist ./ExportOptions.plist
```

### IPA 점검

```bash
unzip -q -o .asc/artifacts/export/App.ipa -d /tmp/ipacheck
cat /tmp/ipacheck/Payload/App.app/capacitor.config.json      # server.url 확인
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" /tmp/ipacheck/Payload/App.app/Info.plist
codesign -dv --verbose=2 /tmp/ipacheck/Payload/App.app
```

---

## 정식 심사로 갈 때 추가로 필요한 것

TestFlight **내부 테스트**는 아래 없이도 된다.

- [ ] **App Privacy 설문** — 공개 API에 없다. 브라우저에서 입력 후 **Publish 클릭까지** 해야 한다.
      저장만 하면 제출이 막히는데 `asc validate`에는 안 잡힌다.
- [ ] **스크린샷** (1284×2778)
- [ ] **개인정보처리방침 / 지원 URL** — 죽은 URL은 무조건 반려
- [ ] ⚠️ **가이드라인 4.2 (최소 기능) 리스크** — 원격 URL을 로드하는 얇은 웹뷰 셸은 정식 심사와
      외부 테스터용 Beta App Review에서 반려 대상이 될 수 있다. 내부 테스트에는 해당 없다.
- [ ] `PrivacyInfo.xcprivacy` (앱 타겟) — 없으면 업로드 후 ITMS-91053 **경고 메일**.
      내부 테스트는 통과하므로 지금은 재아카이브하지 않는다.
