import { NextResponse } from "next/server";

// 연결성 확인 전용 — SW/HTTP 캐시 우회
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
};

export function GET() {
    return NextResponse.json(
        { ok: true },
        { status: 200, headers: noStoreHeaders },
    );
}

export function HEAD() {
    return new Response(null, { status: 204, headers: noStoreHeaders });
}
