"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/organisms/common/PageHeader";
import PopupNotification, {
  NotificationType,
} from "@/components/molecules/common/PopupNotification";
import LocationVerificationModal from "@/components/molecules/LocationVerificationModal";
import LocationStatusIndicator from "@/components/molecules/LocationStatusIndicator";
import { haptic } from "@/lib/haptic";
import { Calendar, ChevronDown, Timer, MapPin, WifiOff, CloudUpload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import LoadingSpinner from "../atoms/LoadingSpinner";
import { useOfflineAttendance } from "@/hooks/useOfflineAttendance";

// 현재 시간 계산 함수들
// 한국 시간 기준으로 현재 시각을 10분 단위로 올림하여 반환하는 함수 (디폴트 시간용)
const getCurrentTime = () => {
  // 1. 현재 시각을 한국 시간으로 가져온다
  const now = new Date();
  const koreaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );

  // 2. 분 단위로 10분 단위 올림 처리
  const currentMinutes = koreaTime.getMinutes();
  const remainder = currentMinutes % 10;
  let adjustedMinutes;
  let adjustedHours = koreaTime.getHours();

  // 무조건 올림 처리 (현재 시간이 정확히 10분 단위가 아니면 다음 10분 단위로 올림)
  if (remainder === 0) {
    adjustedMinutes = currentMinutes;
  } else {
    adjustedMinutes = currentMinutes + (10 - remainder);
  }

  // 60분을 넘으면 시간 조정
  if (adjustedMinutes >= 60) {
    adjustedHours = (adjustedHours + 1) % 24;
    adjustedMinutes = 0;
  }

  // 3. "HH:mm" 형식으로 반환
  return `${adjustedHours.toString().padStart(2, "0")}:${adjustedMinutes
    .toString()
    .padStart(2, "0")}`;
};

const getTodayString = () => {
  const now = new Date();
  const koreaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  return koreaTime.toISOString().split("T")[0];
};

const isFutureDateTime = (date: string, time: string) => {


  const selectedDateTime = new Date(`${date}T${time}:00`);

  // 현재 한국 시간 + 2시간까지 허용
  const now = new Date();
  const koreaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const maxAllowedTime = new Date(koreaTime.getTime() + 2 * 60 * 60 * 1000); // 2시간 더하기



  return selectedDateTime > maxAllowedTime;
};

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
  ["00", "10", "20", "30", "40", "50"].map((m) => ({
    value: `${h.toString().padStart(2, "0")}:${m}`,
    label: `${h.toString().padStart(2, "0")}:${m}`,
  }))
).flat();

const getAvailableTimeOptions = (selectedDate: string) => {
  const today = getTodayString();
  if (selectedDate !== today) {
    return TIME_OPTIONS;
  }

  // 한국 시간 기준으로 현재 시간 + 2시간까지 선택 가능하도록 필터링
  const now = new Date();
  const koreaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );

  // 현재 시간 + 2시간
  const maxAllowedTime = new Date(koreaTime.getTime() + 2 * 60 * 60 * 1000);
  const maxTimeString = `${maxAllowedTime
    .getHours()
    .toString()
    .padStart(2, "0")}:${Math.floor(maxAllowedTime.getMinutes() / 10) * 10}`;

  return TIME_OPTIONS.filter((option) => option.value <= maxTimeString);
};

interface ClientAttendancePageProps {
  initialFormData?: {
    userName: string;
    crewInfo: any;
    locationOptions: any[];
    exerciseOptions: any[];
    crewLocations?: Array<{
      id: number;
      name: string;
      latitude: number | null;
      longitude: number | null;
    }>;
  };
  userStatus?: any;
  userId?: string;
  error?: string;
  canHost?: boolean;
}

const ClientAttendancePage: React.FC<ClientAttendancePageProps> = ({
  initialFormData,
  userStatus,
  userId,
  error,
  canHost = true,
}) => {
  const router = useRouter();
  const { isOnline, queueCount, enqueue, isFlushing } = useOfflineAttendance();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] =
    useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");

  // 위치 기반 출석 관련 상태
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationVerified, setLocationVerified] = useState<boolean | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [canAttendByLocation, setCanAttendByLocation] = useState(true); // 위치 기반 출석 가능 여부

  // 초기 폼 데이터
  const [formData, setFormData] = useState(() => {
    if (initialFormData) {
      return {
        name: initialFormData.userName,
        date: getTodayString(),
        time: getCurrentTime(),
        location: initialFormData.locationOptions[0]?.value || "",
        exerciseType: initialFormData.exerciseOptions[0]?.value || "",
        isHost: "아니오",
      };
    }
    return {
      name: "",
      date: getTodayString(),
      time: getCurrentTime(),
      location: "",
      exerciseType: "",
      isHost: "아니오",
    };
  });

  const handleFormChange = useCallback((field: string, value: string) => {
    if (field === "date") {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        if (value === getTodayString()) {
          const availableOptions = getAvailableTimeOptions(value);
          if (availableOptions.length > 0) {
            // 현재 시간이 선택 가능한 옵션에 없으면 가장 최근 시간으로 설정
            if (!availableOptions.find((opt) => opt.value === prev.time)) {
              newData.time =
                availableOptions[availableOptions.length - 1].value;
            }
          }
        }

        return newData;
      });
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  // 위치 상태 변경 핸들러
  const handleLocationStatusChange = useCallback((canAttend: boolean, message: string) => {
    setCanAttendByLocation(canAttend);
    setLocationMessage(message);
  }, []);

  // 위치 검증 완료 핸들러
  const handleLocationVerified = useCallback((isVerified: boolean, message: string) => {
    setLocationVerified(isVerified);
    setLocationMessage(message);
    setShowLocationModal(false);

    if (isVerified) {
      // 위치 검증 성공 시 출석 제출
      proceedWithSubmission();
    } else {
      // 위치 검증 실패
      haptic.error();
      setNotificationType("error");
      setNotificationMessage(message);
      setShowNotification(true);
    }
  }, []);

  // 실제 출석 제출 처리
  const proceedWithSubmission = useCallback(async () => {
    setIsSubmitting(true);
    haptic.medium();

    setNotificationType("loading");
    setNotificationMessage("출석 처리 중...");
    setShowNotification(true);

    try {
      const attendanceDateTime = new Date(
        `${formData.date}T${formData.time}:00`
      );
      const submissionData = {
        userId,
        crewId: initialFormData!.crewInfo.id,
        locationId: formData.location,
        exerciseTypeId: formData.exerciseType,
        isHost: formData.isHost === "예",
        attendanceTimestamp: attendanceDateTime.toISOString(),
      };

      // 오프라인 상태: 큐에 저장
      if (!isOnline) {
        await enqueue({
          userId: submissionData.userId!,
          crewId: submissionData.crewId,
          locationId: Number(submissionData.locationId),
          exerciseTypeId: Number(submissionData.exerciseTypeId),
          isHost: submissionData.isHost,
          attendanceTimestamp: submissionData.attendanceTimestamp,
        });
        haptic.success();
        setNotificationType("success");
        setNotificationMessage("오프라인 출석이 저장되었습니다. 연결 시 자동 전송됩니다.");
        setIsSubmitting(false);
        setShowNotification(true);
        return;
      }

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        haptic.success();
        setNotificationType("success");
        setNotificationMessage("출석이 완료되었습니다!");
      } else {
        haptic.error();
        setNotificationType("error");
        setNotificationMessage(
          result.message || "출석 처리 중 오류가 발생했습니다."
        );
      }
    } catch (error) {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
      setShowNotification(true);
    }
  }, [formData, initialFormData, userId, isOnline, enqueue]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !userId) return;

    // 사용자 상태 확인
    if (userStatus && !userStatus.isActive) {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage(
        `${userStatus.statusMessage}\n\n${userStatus.suspensionReason}`
      );
      setShowNotification(true);
      return;
    }

    // 허용된 시간 범위 검증
    if (isFutureDateTime(formData.date, formData.time)) {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("허용된 시간 범위를 초과했습니다.");
      setShowNotification(true);
      return;
    }

    // 위치 기반 출석이 활성화된 경우
    if (initialFormData?.crewInfo?.location_based_attendance) {
      // 위치 상태가 출석 불가능한 경우 출석 차단
      if (!canAttendByLocation) {
        haptic.error();
        setNotificationType("error");
        setNotificationMessage(locationMessage || "현재 위치에서는 출석할 수 없습니다.");
        setShowNotification(true);
        return;
      }
      
      // 위치 검증 모달 표시
      setShowLocationModal(true);
      return;
    }

    // 위치 기반 출석이 비활성화된 경우 바로 제출
    proceedWithSubmission();
  }, [isSubmitting, userId, userStatus, formData, initialFormData]);

  const availableTimeOptions = useMemo(
    () => getAvailableTimeOptions(formData.date),
    [formData.date]
  );

  // 에러 상태 처리
  if (error) {
    return (
      <div className='flex flex-col justify-center items-center h-screen bg-rh-bg-primary'>
        <div className='p-4 text-center text-white'>
          <h2 className='mb-4 text-xl font-bold'>오류가 발생했습니다</h2>
          <p className='mb-4'>{error}</p>
          <button
            onClick={() => router.push("/")}
            className='px-4 py-2 text-white rounded bg-rh-accent'
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 초기 데이터가 없는 경우
  if (!initialFormData) {
    return (
      <div className='flex justify-center items-center h-screen bg-rh-bg-primary'>
        <LoadingSpinner size='sm' color='white' />
      </div>
    );
  }

  return (
    <div className='flex overflow-hidden relative flex-col h-screen bg-rh-bg-primary'>
      {/* 헤더 */}
      <div className='fixed top-0 right-0 left-0 z-50'>
        <PageHeader
          title='출석 체크'
          iconColor='white'
          borderColor='rh-border'
        />
      </div>

      {/* 스크롤 가능한 폼 영역 */}
      <div className='flex-1 overflow-y-auto native-scroll pt-20 px-4 pb-4'>
        {/* 오프라인 상태 배너 */}
        {!isOnline && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rh-status-warning/20 px-3 py-2">
            <WifiOff className="h-4 w-4 text-rh-status-warning" />
            <span className="text-xs text-rh-status-warning">
              오프라인 상태 · 출석 시 자동 저장됩니다
            </span>
          </div>
        )}

        {queueCount > 0 && isOnline && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rh-accent/20 px-3 py-2">
            <CloudUpload className="h-4 w-4 text-rh-accent" />
            <span className="text-xs text-rh-accent">
              {isFlushing
                ? "대기 중인 출석을 전송하고 있습니다..."
                : `대기 중인 출석 ${queueCount}건`}
            </span>
          </div>
        )}

        <div className='space-y-5'>
          {/* 날짜 */}
          <div>
            <label className='block mb-1.5 text-xs font-medium text-rh-text-secondary'>
              날짜
            </label>
            <div className='relative'>
              <input
                type='date'
                value={formData.date}
                onChange={(e) => handleFormChange("date", e.target.value)}
                className='text-white ios-date-input bg-rh-bg-surface border border-rh-border'
              />
              <div className='absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none'>
                <Calendar className='w-[18px] h-[18px] text-rh-text-muted' />
              </div>
            </div>
          </div>

          {/* 시간 */}
          <div>
            <label className='block mb-1.5 text-xs font-medium text-rh-text-secondary'>
              시간
            </label>
            <div className='relative'>
              <select
                value={formData.time}
                onChange={(e) => handleFormChange("time", e.target.value)}
                className='text-white ios-select bg-rh-bg-surface border border-rh-border'
              >
                {availableTimeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none'>
                <Timer className='w-[18px] h-[18px] text-rh-text-muted' />
              </div>
            </div>
          </div>

          {/* 장소 */}
          <div>
            <label className='block mb-1.5 text-xs font-medium text-rh-text-secondary'>
              장소
            </label>
            <div className='relative'>
              <select
                value={formData.location}
                onChange={(e) => handleFormChange("location", e.target.value)}
                className='text-white ios-select bg-rh-bg-surface border border-rh-border'
              >
                {initialFormData!.locationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none'>
                <ChevronDown className='w-[18px] h-[18px] text-rh-text-muted' />
              </div>
            </div>
          </div>

          {/* 운동 종류 */}
          <div>
            <label className='block mb-1.5 text-xs font-medium text-rh-text-secondary'>
              운동 종류
            </label>
            <div className='flex gap-2'>
              {initialFormData!.exerciseOptions.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handleFormChange("exerciseType", option.value)}
                  className={`h-10 rounded-rh-md flex-1 text-[13px] transition-colors ${
                    formData.exerciseType === option.value
                      ? "bg-rh-accent text-white font-semibold"
                      : "bg-rh-bg-surface border border-rh-border text-rh-text-secondary font-medium"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 개설자 여부 */}
          <div className='rounded-rh-lg bg-rh-bg-surface px-4 h-[52px] flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-[14px] font-medium text-white'>개설자 여부</span>
              {!canHost && (
                <span className='text-[11px] text-rh-status-warning'>
                  등급 권한 없음
                </span>
              )}
            </div>
            <Switch
              checked={formData.isHost === "예"}
              onCheckedChange={(checked) =>
                handleFormChange("isHost", checked ? "예" : "아니오")
              }
              disabled={!canHost}
            />
          </div>
        </div>

        {/* 위치 상태 */}
        <LocationStatusIndicator
          isLocationBasedAttendance={initialFormData?.crewInfo?.location_based_attendance || false}
          crewLocations={initialFormData?.crewLocations || []}
          allowedRadius={50}
          onStatusChange={handleLocationStatusChange}
        />

      </div>

      {/* 하단 고정 액션 영역 (바텀 네비 위) */}
      <div className='shrink-0 px-4 pb-bottom-inset bg-rh-bg-primary'>
        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            (userStatus && !userStatus.isActive) ||
            (initialFormData?.crewInfo?.location_based_attendance && !canAttendByLocation)
          }
          className={`flex items-center justify-center rounded-[12px] h-[52px] w-full text-[16px] font-semibold text-white transition-all duration-200 active:scale-[0.97] hw-accelerated ${
            isSubmitting ||
            (userStatus && !userStatus.isActive) ||
            (initialFormData?.crewInfo?.location_based_attendance && !canAttendByLocation)
              ? "bg-rh-bg-muted cursor-not-allowed"
              : "bg-rh-accent hover:bg-rh-accent-hover"
          }`}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {isSubmitting ? (
            <div className='flex items-center justify-center gap-2'>
              <LoadingSpinner size='sm' color='white' />
              <span>처리 중...</span>
            </div>
          ) : userStatus && !userStatus.isActive ? (
            "출석 불가"
          ) : (
            "출석하기"
          )}
        </button>
      </div>

      {/* 위치 검증 모달 */}
      <LocationVerificationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onVerified={handleLocationVerified}
        crewLocations={initialFormData?.crewLocations || []}
        allowedRadius={50}
      />

      {/* 알림 팝업 */}
      {notificationType && (
        <PopupNotification
          isVisible={showNotification}
          message={notificationMessage}
          type={notificationType}
          duration={notificationType === "loading" ? 0 : 1500}
          onClose={() => {
            setShowNotification(false);
            if (notificationType === "success") {
              setTimeout(() => router.push("/ranking"), 100);
            } else if (
              notificationType === "error" &&
              userStatus &&
              !userStatus.isActive
            ) {
              setTimeout(() => router.push("/"), 100);
            }
          }}
        />
      )}
    </div>
  );
};

export default ClientAttendancePage;
