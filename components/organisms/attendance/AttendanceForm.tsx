import React, { useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import InputField from "@/components/atoms/InputField";
import DateTimeField from "@/components/atoms/DateTimeField";
import SearchableSelectField from "@/components/atoms/SearchableSelectField";
import RadioGroup from "@/components/molecules/FormFieldGroup";

// Zod 스키마 정의 - 메모이제이션
const attendanceSchema = z.object({
  name: z.string().optional(),
  date: z.string().min(1, "참여일을 선택해주세요"),
  time: z.string().min(1, "참여 시간을 선택해주세요"),
  location: z.string().min(1, "참여 장소를 선택해주세요"),
  exerciseType: z.string().min(1, "운동 종류를 선택해주세요"),
  isHost: z.string().min(1, "개설자 여부를 선택해주세요"),
});

// 폼 데이터 타입
type AttendanceFormData = z.infer<typeof attendanceSchema>;

// AttendanceForm Props 인터페이스
interface AttendanceFormProps {
  initialData?: Partial<AttendanceFormData>;
  locationOptions: { value: string; label: string }[];
  exerciseOptions: { value: string; label: string }[];
  showHostField?: boolean;
  onSubmit?: (data: AttendanceFormData) => void;
}

// 현재 시간 계산 함수 - 메모이제이션
const getCurrentTime = () => {
  const now = new Date();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();

  const remainder = currentMinutes % 10;

  let adjustedMinutes;
  let adjustedHours = now.getHours();

  if (remainder >= 5 || (remainder === 4 && currentSeconds >= 30)) {
    adjustedMinutes = currentMinutes + (10 - remainder);
  } else {
    adjustedMinutes = currentMinutes - remainder;
  }

  if (adjustedMinutes >= 60) {
    adjustedHours = (adjustedHours + 1) % 24;
    adjustedMinutes = 0;
  }

  return `${adjustedHours.toString().padStart(2, "0")}:${adjustedMinutes
    .toString()
    .padStart(2, "0")}`;
};

// 호스트 옵션 - 상수로 메모이제이션
const HOST_OPTIONS = [
  { value: "예", label: "예" },
  { value: "아니오", label: "아니오" },
];

const AttendanceForm: React.FC<AttendanceFormProps> = React.memo(
  ({
    initialData,
    locationOptions,
    exerciseOptions,
    showHostField = true,
    onSubmit,
  }) => {
    // 초기값 계산 - 메모이제이션
    const defaultValues = useMemo(() => {
      const today = new Date().toISOString().split("T")[0];
      return {
        name: initialData?.name || "",
        date: initialData?.date || today,
        time: initialData?.time || getCurrentTime(),
        location:
          initialData?.location ||
          (locationOptions.length > 0 ? locationOptions[0].value : ""),
        exerciseType:
          initialData?.exerciseType ||
          (exerciseOptions.length > 0 ? exerciseOptions[0].value : ""),
        isHost: initialData?.isHost || "아니오",
      };
    }, [initialData, locationOptions, exerciseOptions]);

    const {
      register,
      handleSubmit,
      formState: { errors },
      setValue,
      watch,
    } = useForm<AttendanceFormData>({
      resolver: zodResolver(attendanceSchema),
      defaultValues,
    });

    const formValues = watch();

    // 이벤트 핸들러들 - 메모이제이션
    const handleDateChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue("date", e.target.value);
      },
      [setValue]
    );

    const handleTimeChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setValue("time", e.target.value);
      },
      [setValue]
    );

    const handleRadioChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue("isHost", e.target.value);
      },
      [setValue]
    );

    const handleSearchableSelectChange = useCallback(
      (value: string, name: string) => {
        setValue(name as keyof AttendanceFormData, value);
      },
      [setValue]
    );

    const submitForm = useCallback(
      (data: AttendanceFormData) => {
        if (onSubmit) {
          onSubmit(data);
        }
      },
      [onSubmit]
    );

    // 이름 변경 핸들러 - 메모이제이션
    const handleNameChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue("name", e.target.value);
      },
      [setValue]
    );

    return (
      <form onSubmit={handleSubmit(submitForm)} className='space-y-6'>
        <div>
          <InputField
            label='이름'
            value={formValues.name || ""}
            placeholder='이름 입력'
            onChange={handleNameChange}
            name='name'
            disabled={true}
          />
          {errors.name && (
            <p className='mt-1 text-xs text-red-500'>{errors.name.message}</p>
          )}
        </div>

        <div>
          <DateTimeField
            label='참여일시'
            dateValue={formValues.date}
            timeValue={formValues.time}
            onDateChange={handleDateChange}
            onTimeChange={handleTimeChange}
          />
          {errors.date && (
            <p className='mt-1 text-xs text-red-500'>{errors.date.message}</p>
          )}
          {errors.time && (
            <p className='mt-1 text-xs text-red-500'>{errors.time.message}</p>
          )}
        </div>

        <div>
          <SearchableSelectField
            label='참여 장소'
            value={formValues.location}
            options={locationOptions}
            name='location'
            placeholder='장소 검색...'
            onChange={handleSearchableSelectChange}
          />
          {errors.location && (
            <p className='mt-1 text-xs text-red-500'>
              {errors.location.message}
            </p>
          )}
        </div>

        <div>
          <SearchableSelectField
            label='운동 종류'
            value={formValues.exerciseType}
            options={exerciseOptions}
            name='exerciseType'
            placeholder='운동 검색...'
            onChange={handleSearchableSelectChange}
          />
          {errors.exerciseType && (
            <p className='mt-1 text-xs text-red-500'>
              {errors.exerciseType.message}
            </p>
          )}
        </div>

        {showHostField && (
          <div>
            <RadioGroup
              label='개설자 여부'
              name='isHost'
              options={HOST_OPTIONS}
              selectedValue={formValues.isHost}
              onChange={handleRadioChange}
            />
            {errors.isHost && (
              <p className='mt-1 text-xs text-red-500'>
                {errors.isHost.message}
              </p>
            )}
          </div>
        )}
      </form>
    );
  }
);

AttendanceForm.displayName = "AttendanceForm";

export default AttendanceForm;
