"use client";

import React from "react";
import AdminAttendanceManagement from "@/components/organisms/AdminAttendanceManagement";

// 타입들을 직접 정의
interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  checkInTime: string;
  location: string;
  exerciseType: string;
  status: "present" | "late" | "absent";
  isHost: boolean;
}

interface AttendanceSummary {
  date: string;
  count: number;
}

type AttendanceDetailData = {
  [key: string]: AttendanceRecord[];
};

// 임시 출석 요약 데이터 (서버에서 받을 형태)
const mockAttendanceSummary: AttendanceSummary[] = [
  { date: "2025-01-05", count: 2 },
  { date: "2025-01-10", count: 1 },
  { date: "2025-01-15", count: 3 },
  { date: "2025-01-20", count: 2 },
  { date: "2025-01-25", count: 1 },
];

// 임시 출석 상세 데이터 (클릭 시 서버에서 받을 형태)
const mockAttendanceDetailData: AttendanceDetailData = {
  "2025-01-05": [
    {
      id: "1",
      userId: "1",
      userName: "김러너",
      checkInTime: "2025-01-05 06:30",
      location: "올림픽공원 평화의문",
      exerciseType: "러닝",
      status: "present",
      isHost: false,
    },
    {
      id: "2",
      userId: "2",
      userName: "박달리기",
      checkInTime: "2025-01-05 06:45",
      location: "올림픽공원 평화의문",
      exerciseType: "러닝",
      status: "late",
      isHost: true,
    },
  ],
  "2025-01-10": [
    {
      id: "3",
      userId: "3",
      userName: "이조깅",
      checkInTime: "2025-01-10 06:25",
      location: "한강공원 뚝섬",
      exerciseType: "러닝",
      status: "present",
      isHost: false,
    },
  ],
  "2025-01-15": [
    {
      id: "4",
      userId: "4",
      userName: "최마라톤",
      checkInTime: "2025-01-15 07:00",
      location: "올림픽공원 평화의문",
      exerciseType: "러닝",
      status: "late",
      isHost: false,
    },
    {
      id: "5",
      userId: "5",
      userName: "정스프린트",
      checkInTime: "2025-01-15 06:20",
      location: "남산공원",
      exerciseType: "등산",
      status: "present",
      isHost: true,
    },
    {
      id: "6",
      userId: "6",
      userName: "김헬스",
      checkInTime: "2025-01-15 07:30",
      location: "헬스장",
      exerciseType: "헬스",
      status: "present",
      isHost: false,
    },
  ],
  "2025-01-20": [
    {
      id: "7",
      userId: "7",
      userName: "정헬스",
      checkInTime: "2025-01-20 07:00",
      location: "헬스장",
      exerciseType: "헬스",
      status: "present",
      isHost: true,
    },
    {
      id: "8",
      userId: "8",
      userName: "이요가",
      checkInTime: "2025-01-20 07:15",
      location: "요가스튜디오",
      exerciseType: "요가",
      status: "present",
      isHost: false,
    },
  ],
  "2025-01-25": [
    {
      id: "9",
      userId: "9",
      userName: "최등산",
      checkInTime: "2025-01-25 05:30",
      location: "북한산",
      exerciseType: "등산",
      status: "present",
      isHost: true,
    },
  ],
};

export default function AdminAttendancePage() {
  // 실제 서버 연동 시에는 여기서 API 호출
  // const attendanceSummary = await fetchAttendanceSummary();
  // const attendanceDetailData = await fetchAttendanceDetailData();

  return (
    <AdminAttendanceManagement
      attendanceSummary={mockAttendanceSummary}
      attendanceDetailData={mockAttendanceDetailData}
    />
  );
}
