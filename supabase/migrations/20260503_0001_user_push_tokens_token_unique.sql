-- attendance.user_push_tokens.token 에 UNIQUE 제약 추가.
-- 사유: registerPushTokenAction 의 .upsert(..., { onConflict: 'token' }) 가
-- 이 unique constraint 를 요구한다. 누락 시 Postgres 42P10
-- ("there is no unique or exclusion constraint matching the ON CONFLICT
-- specification") 로 실패하여 모든 푸시 토큰 등록이 실패한다.

ALTER TABLE attendance.user_push_tokens
    ADD CONSTRAINT user_push_tokens_token_key UNIQUE (token);
