"use client";

import Script from "next/script";

interface NaverMapLoaderProps {
  children?: React.ReactNode;
}

export function NaverMapLoader({ children }: NaverMapLoaderProps) {
  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`}
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}