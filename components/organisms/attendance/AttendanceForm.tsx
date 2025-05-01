import React from "react";

// 라디오 버튼 컴포넌트
interface RadioButtonProps {
  label: string;
  value: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  value,
  name,
  checked,
  onChange,
}) => {
  return (
    <label className='flex items-center mr-4 cursor-pointer'>
      <input
        type='radio'
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className='hidden'
      />
      <span
        className={`w-5 h-5 rounded-full border-2 border-[#E3E3EA] mr-2 flex items-center justify-center 
        ${checked ? "bg-primary-blue border-primary-blue" : "bg-white"}
      `}
      >
        {checked && <span className='w-2 h-2 rounded-full bg-white'></span>}
      </span>
      <span
        className={`text-sm ${
          checked ? "font-medium text-primary-blue" : "text-black/60"
        }`}
      >
        {label}
      </span>
    </label>
  );
};

// 입력 필드 컴포넌트
interface InputFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  placeholder,
  onChange,
}) => {
  return (
    <div className='mb-4'>
      <label className='block text-sm font-semibold mb-2'>{label}</label>
      <input
        type='text'
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className='w-full p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm placeholder-black/60 focus:outline-none focus:ring-1 focus:ring-primary-blue'
      />
    </div>
  );
};

const AttendanceForm: React.FC = () => {
  // TODO: Form 상태 관리 (useState, Zod 등) 필요
  const [formData, setFormData] = React.useState({
    name: "홍길동",
    age: "1993",
    date: "2024.2.22",
    location: "반포 한강 공원",
    exerciseType: "러닝",
    isHost: "아니오",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form>
      <InputField
        label='이름'
        value={formData.name}
        placeholder='이름 입력'
        onChange={handleChange}
      />
      <InputField
        label='나이'
        value={formData.age}
        placeholder='나이 입력'
        onChange={handleChange}
      />
      <InputField
        label='참여일'
        value={formData.date}
        placeholder='YYYY.MM.DD'
        onChange={handleChange}
      />
      <InputField
        label='참여 장소'
        value={formData.location}
        placeholder='참여 장소 입력'
        onChange={handleChange}
      />

      <div className='mb-4'>
        <label className='block text-sm font-semibold mb-2'>운동 종류</label>
        <div className='flex'>
          <RadioButton
            label='러닝'
            value='러닝'
            name='exerciseType'
            checked={formData.exerciseType === "러닝"}
            onChange={handleRadioChange}
          />
          <RadioButton
            label='등산'
            value='등산'
            name='exerciseType'
            checked={formData.exerciseType === "등산"}
            onChange={handleRadioChange}
          />
          <RadioButton
            label='자전거'
            value='자전거'
            name='exerciseType'
            checked={formData.exerciseType === "자전거"}
            onChange={handleRadioChange}
          />
          <RadioButton
            label='기타'
            value='기타'
            name='exerciseType'
            checked={formData.exerciseType === "기타"}
            onChange={handleRadioChange}
          />
        </div>
      </div>

      <div className='mb-4'>
        <label className='block text-sm font-semibold mb-2'>개설자 여부</label>
        <div className='flex'>
          <RadioButton
            label='예'
            value='예'
            name='isHost'
            checked={formData.isHost === "예"}
            onChange={handleRadioChange}
          />
          <RadioButton
            label='아니오'
            value='아니오'
            name='isHost'
            checked={formData.isHost === "아니오"}
            onChange={handleRadioChange}
          />
        </div>
      </div>
    </form>
  );
};

export default AttendanceForm;
