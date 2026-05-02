import Link from "next/link";
import { Home } from "lucide-react";

/**
 * 마스터 페이지 헤더 우측 "홈으로 돌아가기" 액션.
 * 마스터 → 일반 사용자 화면(/)으로 빠르게 이탈하는 entry point.
 */
export default function HomeAction() {
    return (
        <Link
            href="/"
            aria-label="홈으로 돌아가기"
            className="flex items-center justify-center w-10 h-10 mr-1 rounded-full active:opacity-70 transition-opacity"
        >
            <Home size={20} className="text-white" />
        </Link>
    );
}
