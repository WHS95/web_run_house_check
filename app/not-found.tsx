import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-rh-bg-primary px-6">
            <div className="text-center">
                <p className="text-rh-hero font-bold text-rh-accent">
                    404
                </p>
                <h1 className="mt-2 text-rh-title2 font-bold text-white">
                    페이지를 찾을 수 없습니다
                </h1>
                <p className="mt-2 text-rh-body text-rh-text-secondary">
                    요청하신 페이지가 존재하지 않거나
                    <br />
                    이동되었을 수 있습니다.
                </p>
                <Link
                    href="/"
                    className="mt-6 inline-flex items-center gap-2 rounded-rh-lg bg-rh-accent px-6 py-3 text-rh-body font-semibold text-white"
                >
                    <Home className="h-4 w-4" />
                    홈으로 돌아가기
                </Link>
            </div>
        </div>
    );
}
