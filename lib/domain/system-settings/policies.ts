import type { SystemSettings } from './types';

/**
 * 위험 변경 여부.
 *
 * 클러스터링 임계값을 너무 좁히면 (절반 미만으로) 기존에 한 세션이던 출석들이
 * 다음 출석부터 분리되어 운영 혼란이 발생할 수 있다.
 * 이런 경우 UI에서 추가 확인을 요구해야 한다.
 */
export function 위험변경_여부(
    이전: Pick<SystemSettings, 'session_window_minutes' | 'session_radius_m'>,
    이후: Pick<SystemSettings, 'session_window_minutes' | 'session_radius_m'>,
): boolean {
    const window좁아짐 =
        이후.session_window_minutes < 이전.session_window_minutes / 2;
    const radius좁아짐 =
        이후.session_radius_m < 이전.session_radius_m / 2;
    return window좁아짐 || radius좁아짐;
}
