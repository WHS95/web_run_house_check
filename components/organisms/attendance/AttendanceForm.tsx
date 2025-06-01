import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import InputField from "@/components/atoms/InputField";
import DateTimeField from "@/components/atoms/DateTimeField";
import SearchableSelectField from "@/components/atoms/SearchableSelectField";
import RadioGroup from "@/components/molecules/FormFieldGroup";

// Zod 스키마 정의 (time 필드 추가)
const attendanceSchema = z.object({
  name: z.string().optional(),
  date: z.string().min(1, "참여일을 선택해주세요"),
  time: z.string().min(1, "참여 시간을 선택해주세요"),
  location: z.string().min(1, "참여 장소를 선택해주세요"),
  exerciseType: z.string().min(1, "운동 종류를 선택해주세요"),
  isHost: z.string().min(1, "개설자 여부를 선택해주세요"),
});

// 폼 데이터 타입 (time 필드 추가)
type AttendanceFormData = z.infer<typeof attendanceSchema>;

// AttendanceForm Props 인터페이스 정의
interface AttendanceFormProps {
  // initialData는 age가 없는 AttendanceFormData의 Partial 형태
  initialData?: Partial<AttendanceFormData>;
  locationOptions: { value: string; label: string }[];
  exerciseOptions: { value: string; label: string }[];
  showHostField?: boolean;
  onSubmit?: (data: AttendanceFormData) => void; // age가 없는 타입
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  initialData,
  locationOptions,
  exerciseOptions,
  showHostField = true,
  onSubmit,
}) => {
  // 현재 시간을 10분 단위로 가장 가까운 시간으로 설정
  const getCurrentTime = () => {
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();

    // 현재 분을 10분 단위로 나눈 나머지
    const remainder = currentMinutes % 10;

    let adjustedMinutes;
    let adjustedHours = now.getHours();

    // 5분 이상이면 다음 10분 단위로, 5분 미만이면 현재 10분 단위로
    if (remainder >= 5 || (remainder === 4 && currentSeconds >= 30)) {
      // 다음 10분 단위로 올림
      adjustedMinutes = currentMinutes + (10 - remainder);
    } else {
      // 현재 10분 단위로 내림
      adjustedMinutes = currentMinutes - remainder;
    }

    // 60분을 넘어가면 시간 조정
    if (adjustedMinutes >= 60) {
      adjustedHours = (adjustedHours + 1) % 24;
      adjustedMinutes = 0;
    }

    return `${adjustedHours.toString().padStart(2, "0")}:${adjustedMinutes
      .toString()
      .padStart(2, "0")}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AttendanceFormData>({
    // 제네릭 타입을 수정된 AttendanceFormData로 변경
    resolver: zodResolver(attendanceSchema), // omit 없이 스키마 직접 사용
    defaultValues: {
      name: initialData?.name || "",
      date: initialData?.date || new Date().toISOString().split("T")[0],
      time: initialData?.time || getCurrentTime(),
      location:
        initialData?.location ||
        (locationOptions.length > 0 ? locationOptions[0].value : ""),
      exerciseType:
        initialData?.exerciseType ||
        (exerciseOptions.length > 0 ? exerciseOptions[0].value : ""),
      isHost: initialData?.isHost || "아니오",
    },
  });

  const formValues = watch();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("date", e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("time", e.target.value);
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("isHost", e.target.value);
  };

  const handleSearchableSelectChange = (value: string, name: string) => {
    setValue(name as keyof AttendanceFormData, value); // 타입을 AttendanceFormData로 변경
  };

  const hostOptions = [
    { value: "예", label: "예" },
    { value: "아니오", label: "아니오" },
  ];

  const submitForm = (data: AttendanceFormData) => {
    // 타입을 AttendanceFormData로 변경
    if (onSubmit) {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(submitForm)}>
      <InputField
        label='이름'
        value={formValues.name || ""}
        placeholder='이름 입력'
        onChange={(e) => setValue("name", e.target.value)}
        name='name'
        disabled={true}
      />
      {errors.name && (
        <p className='mt-1 text-xs text-red-500'>{errors.name.message}</p>
      )}

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

      <SearchableSelectField
        label='참여 장소'
        value={formValues.location}
        options={locationOptions}
        name='location'
        placeholder='장소 검색...'
        onChange={handleSearchableSelectChange}
      />
      {errors.location && (
        <p className='mt-1 text-xs text-red-500'>{errors.location.message}</p>
      )}

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

      {showHostField && (
        <>
          <RadioGroup
            label='개설자 여부'
            name='isHost'
            options={hostOptions}
            selectedValue={formValues.isHost}
            onChange={handleRadioChange}
          />
          {errors.isHost && (
            <p className='mt-1 text-xs text-red-500'>{errors.isHost.message}</p>
          )}
        </>
      )}
    </form>
  );
};

export default AttendanceForm;
