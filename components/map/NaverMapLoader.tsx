"use client";

import Script from "next/script";

interface NaverMapLoaderProps {
  children?: React.ReactNode;
}

export function NaverMapLoader({ children }: NaverMapLoaderProps) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const mapUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
  // const mapUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;

  console.log("🔑 [NaverMapLoader] Client ID:", clientId);
  console.log("🌐 [NaverMapLoader] Map URL:", mapUrl);

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`}
        strategy='afterInteractive'
      />
      {children}
    </>
  );
}

export default NaverMapLoader;
