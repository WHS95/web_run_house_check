"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EnhancedHomeTemplate from "@/components/templates/EnhancedHomeTemplate";
import PopupNotification, {
  NotificationType,
} from "@/components/molecules/common/PopupNotification";
import { haptic } from "@/lib/haptic";

interface HomePageData {
  userName: string;
  crewName: string | null;
  noticeText: string | null;
}

interface ClientHomePageProps {
  initialData: HomePageData;
}

const ClientHomePage: React.FC<ClientHomePageProps> = ({ initialData }) => {
  const router = useRouter();
  const [pageData] = useState<HomePageData>(initialData);
  
  // 알림 상태
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  // URL 파라미터로 전달된 에러 메시지 처리
  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const message = urlParams.get("message");
    
    if (error === "access_denied" && message) {
      setNotification({
        message: decodeURIComponent(message),
        type: "error"
      });
      haptic.error();
      
      // URL에서 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      newUrl.searchParams.delete("message");
      window.history.replaceState({}, "", newUrl.pathname);
    } else if (error === "permission_check_failed") {
      setNotification({
        message: "권한 확인 중 오류가 발생했습니다.",
        type: "error"
      });
      haptic.error();
      
      // URL에서 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.pathname);
    }
  }, []);

  return (
    <>
      <EnhancedHomeTemplate
        username={pageData.userName}
        crewName={pageData.crewName}
        rankName='Beginer' // 기본값으로 고정
        noticeText={pageData.noticeText}
      />
      
      {/* 알림 */}
      {notification && (
        <PopupNotification
          isVisible={!!notification}
          message={notification.message}
          type={notification.type}
          duration={4000}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

export default ClientHomePage;