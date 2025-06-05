import React from "react";
import UltraFastAttendanceTemplate from "@/components/templates/UltraFastAttendanceTemplate";

// 동적 렌더링 강제 (클라이언트 렌더링)
export const dynamic = "force-dynamic";

export default function AttendancePage() {
  return <UltraFastAttendanceTemplate />;
}
