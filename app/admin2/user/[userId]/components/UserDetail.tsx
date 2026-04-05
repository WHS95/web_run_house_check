"use client";
import type { CrewUserDetail } from "@/lib/admin2/queries";

interface Props {
    detail: CrewUserDetail;
    crewId: string;
}

export default function UserDetail({ detail }: Props) {
    return (
        <div className="flex-1 px-4 pt-4">
            <pre className="text-xs text-white">
                {JSON.stringify(detail, null, 2)}
            </pre>
        </div>
    );
}
