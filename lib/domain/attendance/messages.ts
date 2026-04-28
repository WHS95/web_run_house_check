const KST_TZ = 'Asia/Seoul';

export interface AttendanceMessageInput {
    userName: string | null;
    birthYear: number | null;
    timestamp: string;
    locationName: string;
}

/**
 * 출석 알림 푸시 본문 메시지 조립.
 * "홍길동(90)님이 21:00분 한강에 출석을 하였습니다." 같은 한국어 문장.
 */
export function 알림메시지_조립(input: AttendanceMessageInput): string {
    const userName = input.userName || '회원';
    const birthSuffix =
        input.birthYear != null ? String(input.birthYear).slice(-2) : null;
    const displayName = birthSuffix
        ? `${userName}(${birthSuffix})`
        : userName;
    const time = new Date(input.timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: KST_TZ,
    });
    return `${displayName}님이 ${time}분 ${input.locationName}에 출석을 하였습니다.`;
}
