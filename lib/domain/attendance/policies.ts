const KST_TZ = 'Asia/Seoul';
const ALLOW_AHEAD_MS = 2 * 60 * 60 * 1000;

/**
 * KST 기준 현재 + 2시간 이내인지 검사.
 * 현재 시각을 KST로 변환한 뒤 ALLOW_AHEAD_MS만큼 더한 값과 비교.
 */
export function 유효한가(현재: Date, 출석시각: string): boolean {
    const koreaTime = new Date(
        현재.toLocaleString('en-US', { timeZone: KST_TZ })
    );
    const max = new Date(koreaTime.getTime() + ALLOW_AHEAD_MS);
    return new Date(출석시각) <= max;
}

/**
 * 크루의 미등록 장소 출석 허용 여부.
 */
export function 미등록허용(
    crew: { allow_unregistered_location: boolean }
): boolean {
    return crew.allow_unregistered_location === true;
}

/**
 * 크루의 위치 기반 출석 정책 — locationId='unregistered' 사용 가능 여부.
 * - location_based_attendance=true (위치 기반 ON): 'unregistered'는 별도 allow_unregistered_location 따름
 * - location_based_attendance=false (OFF): 'unregistered' 자유 허용
 *
 * 단순화: 현재 비즈니스 의도는 "어드민이 위치기반 출석을 켰을 때만 위치 검증을 강제한다"
 * 위치기반 OFF 인 크루에선 클라이언트가 위치 모달을 거치지 않으므로 unregistered로 간주.
 */
export function 위치기반_출석필요한가(
    crew: { location_based_attendance: boolean }
): boolean {
    return crew.location_based_attendance === true;
}

const ACTIVE_LIKE = new Set(['ACTIVE', null, undefined, '']);

/**
 * 사용자가 출석 가능한 상태인가?
 * users.status / user_crews.status 조합으로 판정.
 *
 * 둘 중 하나라도 SUSPENDED/INACTIVE/WITHDRAWN이면 차단.
 * (대소문자 무관 비교)
 *
 * 현재 admin 토글이 user_crews.status를 ACTIVE↔SUSPENDED로 갱신하므로
 * 기본 케이스는 user_crews.status 검증. users.status는 추가 안전망.
 *
 * @deprecated `lib/domain/access/policies.ts`의 `출석등록_가능한가`로 이전됨.
 *             신규 호출자는 access 모듈을 사용. 본 함수는 다음 chunk에서 제거.
 */
export function 출석가능상태인가(input: {
    userStatus?: string | null;
    userCrewStatus?: string | null;
}): boolean {
    return 활성_상태인가(input.userStatus) && 활성_상태인가(input.userCrewStatus);
}

function 활성_상태인가(raw: string | null | undefined): boolean {
    if (raw === null || raw === undefined || raw === '') return true;
    const upper = raw.toUpperCase();
    if (ACTIVE_LIKE.has(upper)) return true;
    return upper === 'ACTIVE';
}

export interface RecentActiveMeetRow {
    location: string | null | undefined;
    attendeeCount: number | null | undefined;
    meetingStartedAt: string | null | undefined;
}

export interface ActiveMeetBannerVM {
    location: string;
    attendeeCount: number;
    meetingStartedAt: string;
    /** "5월 12일 17:20" 같은 사람-친화 시각 표기 (KST). */
    meetingStartedLabel: string;
    /** localStorage dismiss 키 — 모임 단위로 고유 */
    dismissKey: string;
}

/**
 * RPC 응답을 배너 ViewModel로 변환. 표시 조건 미충족 시 null.
 *
 * 표시 조건:
 *   - location 비어있지 않음
 *   - attendeeCount >= 1
 *   - meetingStartedAt 파싱 가능
 */
export function 활성모임_배너VM_생성(
    row: RecentActiveMeetRow | null | undefined
): ActiveMeetBannerVM | null {
    if (!row) return null;
    const location = (row.location ?? '').trim();
    if (!location) return null;
    const count = Number(row.attendeeCount ?? 0);
    if (!Number.isFinite(count) || count < 1) return null;
    const startedAt = row.meetingStartedAt;
    if (!startedAt) return null;
    const startedDate = new Date(startedAt);
    if (Number.isNaN(startedDate.getTime())) return null;
    return {
        location,
        attendeeCount: count,
        meetingStartedAt: startedAt,
        meetingStartedLabel: 모임시작_라벨생성(startedDate),
        dismissKey: 모임_식별키생성(location, startedAt),
    };
}

/**
 * "5월 12일 17:20" 형태의 KST 라벨.
 */
function 모임시작_라벨생성(d: Date): string {
    const m = Number(
        d.toLocaleString('en-US', { timeZone: KST_TZ, month: 'numeric' })
    );
    const day = Number(
        d.toLocaleString('en-US', { timeZone: KST_TZ, day: 'numeric' })
    );
    const hh = d.toLocaleString('en-US', {
        timeZone: KST_TZ,
        hour: '2-digit',
        hourCycle: 'h23',
    });
    const mm = d.toLocaleString('en-US', {
        timeZone: KST_TZ,
        minute: '2-digit',
    });
    const hour = hh.padStart(2, '0');
    const minute = mm.padStart(2, '0');
    return `${m}월 ${day}일 ${hour}:${minute}`;
}

/**
 * 닫기 처리 시 localStorage에 저장할 모임 식별 키.
 * location + 시작시각 기준이라 같은 장소에서 새 모임이 열리면 다시 노출된다.
 */
function 모임_식별키생성(location: string, startedAt: string): string {
    return `runhouse:active-meet-dismissed:${location}:${startedAt}`;
}

/**
 * Haversine 공식으로 두 좌표 사이의 거리를 미터로 계산.
 *
 * 감지 기반 출석 시스템에서 출석 좌표가 활성 세션 반경 안에 있는지
 * 판정하기 위해 사용한다.
 */
export function 좌표거리_미터(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
): number {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sin1 = Math.sin(dLat / 2);
    const sin2 = Math.sin(dLng / 2);
    const c =
        sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(c));
}

/**
 * 출석 좌표가 활성 세션 반경 안인가?
 *
 * 임계값(미터)은 system_settings.session_radius_m 또는 세션 자체의 radius_m
 * 둘 중 호출자가 결정해 전달한다. (보통 더 작은 쪽)
 */
export function 세션귀속_가능여부(
    출석좌표: { lat: number; lng: number },
    세션: {
        center_lat: number;
        center_lng: number;
        radius_m: number;
    },
    임계값_m: number,
): boolean {
    const dist = 좌표거리_미터(출석좌표, {
        lat: 세션.center_lat,
        lng: 세션.center_lng,
    });
    return dist <= 임계값_m;
}
