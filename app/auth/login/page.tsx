import React, { Suspense } from "react";
import LoginTemplate from "@/components/templates/LoginTemplate";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <LoginTemplate />
    </Suspense>
  );
}
