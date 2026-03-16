import { cache } from "react";
import { verifyAdminAuth } from "@/lib/admin-auth";

// 요청당 한 번만 인증 실행 (React.cache)
export const getAdminAuth = cache(async () => {
    return verifyAdminAuth();
});
