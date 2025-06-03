import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminAuthData {
  userId: string;
  crewId: string;
  firstName: string;
  isLoading: boolean;
  error: string | null;
}

export function useAdminAuth(): AdminAuthData {
  const [authData, setAuthData] = useState<AdminAuthData>({
    userId: "",
    crewId: "",
    firstName: "",
    isLoading: true,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();

        // 1. 사용자 인증 확인
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // 2. 사용자의 crew 정보 조회
        const { data: userData, error: userDataError } = await supabase
          .schema("attendance")
          .from("users")
          .select("id, first_name, is_crew_verified, verified_crew_id")
          .eq("id", user.id)
          .single();

        if (userDataError || !userData) {
          router.push("/login");
          return;
        }

        // 3. crew 인증 확인
        if (!userData.is_crew_verified || !userData.verified_crew_id) {
          router.push("/crew-verification");
          return;
        }

        setAuthData({
          userId: userData.id,
          crewId: userData.verified_crew_id,
          firstName: userData.first_name || "",
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("인증 확인 중 오류:", error);
        setAuthData((prev) => ({
          ...prev,
          isLoading: false,
          error: "인증 확인 중 오류가 발생했습니다.",
        }));
      }
    }

    checkAuth();
  }, [router]);

  return authData;
}
