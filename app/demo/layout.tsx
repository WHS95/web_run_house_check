import { ReactNode, Suspense } from "react";
import DemoChrome from "./_components/DemoChrome";

export const metadata = {
    title: "런하우스 체험",
    description: "런하우스를 둘러보세요 (체험 모드)",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={null}>
            <DemoChrome>{children}</DemoChrome>
        </Suspense>
    );
}
