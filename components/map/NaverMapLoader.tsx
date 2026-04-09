"use client";

import Script from "next/script";
import {
    createContext,
    useContext,
    useState,
    useCallback,
} from "react";

interface NaverMapContextValue {
    isReady: boolean;
}

const NaverMapContext =
    createContext<NaverMapContextValue>({
        isReady: false,
    });

export function useNaverMapReady() {
    return useContext(NaverMapContext).isReady;
}

interface NaverMapLoaderProps {
    children?: React.ReactNode;
}

export function NaverMapLoader({
    children,
}: NaverMapLoaderProps) {
    const [isReady, setIsReady] = useState(
        () => !!window.naver?.maps,
    );

    const handleReady = useCallback(() => {
        setIsReady(true);
    }, []);

    return (
        <NaverMapContext.Provider value={{ isReady }}>
            <Script
                src={
                    "https://oapi.map.naver.com/"
                    + "openapi/v3/maps.js?ncpKeyId="
                    + process.env
                        .NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
                    + "&submodules=geocoder"
                }
                strategy="afterInteractive"
                onReady={handleReady}
            />
            {children}
        </NaverMapContext.Provider>
    );
}

export default NaverMapLoader;
