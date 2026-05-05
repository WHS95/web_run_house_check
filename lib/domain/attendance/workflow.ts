import { 좌표거리_미터, 세션귀속_가능여부 } from './policies';

/**
 * 클러스터링용 활성 세션 표현.
 *
 * 호출자(actions/RPC)가 DB에서 ended_at IS NULL인 세션을 가져와
 * last_joined_at(가장 최근 멤버 합류 시각)과 함께 전달한다.
 */
export interface OpenSession {
    id: string;
    center_lat: number;
    center_lng: number;
    radius_m: number;
    last_joined_at: Date;
}

/**
 * 클러스터링 결정 결과.
 *
 * - attach: 기존 세션에 귀속 (sessionId 포함)
 * - create: 새 세션 생성 필요 (호출자가 INSERT)
 */
export interface ClusterDecision {
    type: 'attach' | 'create';
    sessionId?: string;
}

interface ClusterInput {
    capturedAt: Date;
    capturedLat: number;
    capturedLng: number;
    openSessions: OpenSession[];
    /** system_settings.session_window_minutes */
    windowMinutes: number;
    /** system_settings.session_radius_m */
    radiusM: number;
}

/**
 * 들어온 출석 좌표/시각이 어떤 세션에 귀속되는지 결정.
 *
 * 룰:
 * - 활성 세션 중 ±windowMinutes 분 이내, ±radiusM 미터 이내인 세션이 있으면 attach.
 * - 후보가 여럿이면 가장 가까운(거리 최단) 세션 선택.
 * - 후보가 없으면 create.
 *
 * 순수 함수 — 호출자가 OpenSession[] 를 미리 조회해 전달한다.
 */
export function 세션귀속_결정(args: ClusterInput): ClusterDecision {
    const windowMs = args.windowMinutes * 60 * 1000;
    const capturedPoint = {
        lat: args.capturedLat,
        lng: args.capturedLng,
    };

    const candidates = args.openSessions
        .filter(
            (s) =>
                Math.abs(
                    args.capturedAt.getTime() -
                        s.last_joined_at.getTime(),
                ) <= windowMs,
        )
        .filter((s) =>
            세션귀속_가능여부(capturedPoint, s, args.radiusM),
        )
        .sort(
            (a, b) =>
                좌표거리_미터(capturedPoint, {
                    lat: a.center_lat,
                    lng: a.center_lng,
                }) -
                좌표거리_미터(capturedPoint, {
                    lat: b.center_lat,
                    lng: b.center_lng,
                }),
        );

    if (candidates.length > 0) {
        return { type: 'attach', sessionId: candidates[0].id };
    }
    return { type: 'create' };
}
