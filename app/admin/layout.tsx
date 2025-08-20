import { ReactNode } from "react";
import { AdminContextProvider } from "./AdminContextProvider";
import { verifyAdminAuth } from "@/lib/admin-auth";
import AdminLayoutWrapper from "@/components/organisms/AdminLayoutWrapper";
import type { Metadata } from "next";

// 관리자 페이지 메타데이터
export const metadata: Metadata = {
  title: "런하우스 - 관리자",
  description: "러닝크루 관리자 대시보드 - 회원관리, 출석관리, 크루설정",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "런하우스 - 관리자",
    description: "러닝크루 관리자 대시보드 - 회원관리, 출석관리, 크루설정",
    type: "website",
    locale: "ko_KR",
    siteName: "런하우스",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "런하우스 관리자 - 러닝크루 관리 플랫폼",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "런하우스 - 관리자",
    description: "러닝크루 관리자 대시보드",
    images: ["/android-chrome-512x512.png"],
  },
};

// 서버 컴포넌트 - Layout
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 서버사이드에서 한 번만 인증 체크
  const authData = await verifyAdminAuth();

  return (
    <AdminContextProvider
      crewId={authData.crewId}
      userId={authData.userId}
      firstName={authData.firstName}
    >
      <AdminLayoutWrapper>
        {children}
      </AdminLayoutWrapper>
    </AdminContextProvider>
  );
}
