-- attendance.upsert_push_token: FCM 토큰 등록 전용 SECURITY DEFINER 함수
--
-- 문제: ON CONFLICT (token) DO UPDATE 시 기존 row의 user_id가 다른 사용자(같은 기기,
-- 다른 계정)면 RLS USING 체크가 기존 row를 보지 못해 42501 에러 발생.
--
-- 해결: SECURITY DEFINER 함수 내에서
--   1) 같은 token 이 이미 있으면 무조건 DELETE (소유자 무관)
--   2) 현재 auth.uid() 로 새 row INSERT
-- 기기 재사용(logout → 다른 계정 login) 케이스를 RLS 우회 없이 처리.
-- 함수 자체가 definer 권한으로 실행되므로 호출자가 직접 타인 row를 볼 수 없음.

CREATE OR REPLACE FUNCTION attendance.upsert_push_token(
    p_token    text,
    p_crew_id  uuid,
    p_platform text DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
BEGIN
    -- 같은 토큰이 다른 user_id로 등록된 경우를 포함해 기존 row 제거
    DELETE FROM attendance.user_push_tokens
    WHERE token = p_token;

    -- 현재 인증 사용자로 새 row 삽입
    INSERT INTO attendance.user_push_tokens
        (user_id, crew_id, token, platform, is_active, updated_at)
    VALUES
        (auth.uid(), p_crew_id, p_token, p_platform, true, now());
END;
$$;

-- public은 실행 불가, authenticated 만 허용
REVOKE ALL ON FUNCTION attendance.upsert_push_token(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.upsert_push_token(text, uuid, text)
    TO authenticated;
