"use client";

import AdminGradeManagement from "@/components/organisms/AdminGradeManagement";

export default function GradeManagementWrapper({
    crewId,
}: {
    crewId: string;
}) {
    return <AdminGradeManagement crewId={crewId} />;
}
