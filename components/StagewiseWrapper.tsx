"use client";

import { useEffect, useState } from "react";
import { StagewiseToolbar } from "@stagewise/toolbar-next";

export default function StagewiseWrapper() {
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 환경 변수 확인
    setIsDevelopment(process.env.NODE_ENV === "development");
  }, []);

  // 개발 모드가 아니면 아무것도 렌더링하지 않음
  if (!isDevelopment) {
    return null;
  }

  return (
    <StagewiseToolbar
      config={{
        plugins: [], // 필요한 경우 여기에 사용자 정의 플러그인을 추가할 수 있습니다.
      }}
    />
  );
}
