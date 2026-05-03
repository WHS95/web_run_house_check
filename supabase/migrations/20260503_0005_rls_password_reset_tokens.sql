-- RunHouse RLS Phase 1b: attendance.password_reset_tokens
--
-- 정책 요지: 정책 0개 = 모든 anon/authenticated 요청 deny.
-- 토큰 생성/검증/소비는 SECURITY DEFINER RPC 또는 service_role 로만 가능.
--
-- 영향 분석: 코드베이스에서 .from('password_reset_tokens') 호출 0건.
-- 미래 비밀번호 재설정 RPC 추가 시 SECURITY DEFINER + 명시적 권한 검증 필수.

ALTER TABLE attendance.password_reset_tokens ENABLE ROW LEVEL SECURITY;
