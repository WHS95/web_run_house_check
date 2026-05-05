/**
 * 세션 종료/보정 관련 푸시 알림 메시지 템플릿.
 *
 * 본 모듈은 순수 함수만 포함한다 (Supabase/Next/React import 없음).
 */

export interface 세션종료_푸시_입력 {
    label: string | null;
    memberCount: number;
}

export interface 푸시메시지 {
    title: string;
    body: string;
}

/**
 * 세션 종료 시 운영진/멤버에게 보낼 푸시 메시지 조립.
 */
export function 세션종료_푸시조립(
    args: 세션종료_푸시_입력,
): 푸시메시지 {
    const label = args.label?.trim() || '모임';
    return {
        title: `${label} 종료`,
        body: `${args.memberCount}명 출석 완료`,
    };
}

/**
 * 멤버가 세션에 추가/제거 되었을 때 알림 메시지.
 */
export function 보정_알림조립(args: {
    action: 'add' | 'remove';
    sessionLabel: string | null;
}): 푸시메시지 {
    const label = args.sessionLabel?.trim() || '모임';
    if (args.action === 'add') {
        return {
            title: '출석 추가',
            body: `${label} 세션에 출석이 추가되었습니다.`,
        };
    }
    return {
        title: '출석 제거',
        body: `${label} 세션에서 출석이 제외되었습니다.`,
    };
}
