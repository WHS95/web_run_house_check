import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import InputField from "@/components/atoms/InputField";
import DateField from "@/components/atoms/DateField";
import SearchableSelectField from "@/components/atoms/SearchableSelectField";
import RadioGroup from "@/components/molecules/FormFieldGroup";

// Zod 스키마 정의
const attendanceSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  age: z.string().min(1, "나이를 입력해주세요"),
  date: z.string().min(1, "참여일을 선택해주세요"),
  location: z.string().min(1, "참여 장소를 선택해주세요"),
  exerciseType: z.string().min(1, "운동 종류를 선택해주세요"),
  isHost: z.string().min(1, "개설자 여부를 선택해주세요"),
});

// 폼 데이터 타입
type AttendanceFormData = z.infer<typeof attendanceSchema>;

// AttendanceForm Props 인터페이스 정의
interface AttendanceFormProps {
  initialData?: Partial<AttendanceFormData>;
  locationOptions: { value: string; label: string }[];
  exerciseOptions: { value: string; label: string }[];
  showHostField?: boolean;
  onSubmit?: (data: AttendanceFormData) => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  initialData,
  locationOptions,
  exerciseOptions,
  showHostField = true,
  onSubmit,
}) => {
  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      name: initialData?.name || "",
      age: initialData?.age || "",
      date: initialData?.date || "",
      location:
        initialData?.location ||
        (locationOptions.length > 0 ? locationOptions[0].value : ""),
      exerciseType:
        initialData?.exerciseType ||
        (exerciseOptions.length > 0 ? exerciseOptions[0].value : ""),
      isHost: initialData?.isHost || "아니오",
    },
  });

  // 현재 폼 값 구독
  const formValues = watch();

  // 날짜 포맷 변환 (YYYY-MM-DD 형식으로)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";

    // YYYY.MM.DD 형식을 YYYY-MM-DD로 변환
    const parts = dateString.split(".");
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(
        2,
        "0"
      )}`;
    }

    return dateString;
  };

  // YYYY-MM-DD 형식에서 YYYY.MM.DD 형식으로 변환 (표시용)
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const parts = value.split("-");
    if (parts.length === 3) {
      const formattedDate = `${parts[0]}.${parts[1]}.${parts[2]}`;
      setValue("date", formattedDate);
    } else {
      setValue("date", value);
    }
  };

  // 라디오 버튼 변경 처리
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("isHost", e.target.value);
  };

  // 검색 가능한 셀렉트 박스 변경 처리
  const handleSearchableSelectChange = (value: string, name: string) => {
    setValue(name as keyof AttendanceFormData, value);
  };

  const hostOptions = [
    { value: "예", label: "예" },
    { value: "아니오", label: "아니오" },
  ];

  const submitForm = (data: AttendanceFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(submitForm)}>
      <InputField
        label='이름'
        value={formValues.name}
        placeholder='이름 입력'
        onChange={(e) => setValue("name", e.target.value)}
        name='name'
        disabled={true}
      />
      {errors.name && (
        <p className='mt-1 text-xs text-red-500'>{errors.name.message}</p>
      )}

      <InputField
        label='나이'
        value={formValues.age}
        placeholder='나이 입력'
        onChange={(e) => setValue("age", e.target.value)}
        name='age'
        disabled={true}
      />
      {errors.age && (
        <p className='mt-1 text-xs text-red-500'>{errors.age.message}</p>
      )}

      <DateField
        label='참여일'
        value={formatDateForInput(formValues.date)}
        onChange={handleDateChange}
      />
      {errors.date && (
        <p className='mt-1 text-xs text-red-500'>{errors.date.message}</p>
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
