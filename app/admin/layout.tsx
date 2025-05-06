"use client";

import { ReactNode } from "react";
import AdminHeader from "@/components/organisms/AdminHeader";
import AdminBottomNav from "@/components/organisms/AdminBottomNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <AdminHeader />
      {/* 메인 컨텐츠 */}
      <main className='flex-1 pb-16 overflow-y-auto'>{children}</main>
      <AdminBottomNav />
    </div>
  );
}
