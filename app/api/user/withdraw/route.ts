import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function DELETE() {
    try {
        const supabase = await createClient();

        // 1) 인증 확인
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                {
                    success: false,
                    error: "unauthorized",
                    message: "인증되지 않은 사용자입니다.",
                },
                { status: 401 }
            );
        }

        // 2) Service role 클라이언트 (RLS 우회 + Auth Admin)
        const supabaseAdmin = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 3) PII 익명화 RPC 호출
        const { data: rpcResult, error: rpcError } = await supabaseAdmin
            .schema("attendance")
            .rpc("withdraw_user", { p_user_id: user.id });

        if (rpcError) {
            return NextResponse.json(
                {
                    success: false,
                    error: "rpc_failed",
                    message:
                        rpcError.message ||
                        "탈퇴 처리 중 오류가 발생했습니다.",
                },
                { status: 500 }
            );
        }

        if (!rpcResult?.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: rpcResult?.error || "rpc_failed",
                    message:
                        rpcResult?.message || "탈퇴 처리에 실패했습니다.",
                },
                { status: 500 }
            );
        }

        // 4) auth.users 완전 삭제 (재가입 가능하도록)
        const { error: deleteAuthError } =
            await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteAuthError) {
            // PII는 이미 익명화됨. auth 삭제 실패는 사용자에게 알리되
            // 보안 노출은 없음.
            return NextResponse.json(
                {
                    success: false,
                    error: "auth_delete_failed",
                    message:
                        "계정 데이터는 익명화되었으나 인증 삭제에 실패했습니다. 다시 시도해주세요.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "탈퇴가 완료되었습니다.",
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: "internal_error",
                message:
                    error instanceof Error
                        ? error.message
                        : "서버 오류가 발생했습니다.",
            },
            { status: 500 }
        );
    }
}
