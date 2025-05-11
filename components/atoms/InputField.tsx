import React from "react";

interface InputFieldProps {
  label: string;
  value: string;
  placeholder: string;
  name?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  placeholder,
  name,
  onChange,
  disabled = false,
}) => {
  return (
    <div className='mb-4'>
      <label className='block mb-2 text-sm font-semibold'>{label}</label>
      <input
        type='text'
        value={value}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className={`w-full p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm placeholder-black/60 focus:outline-none focus:ring-1 focus:ring-primary-blue ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-gray-200 text-gray-700 border-gray-300"
            : ""
        }`}
      />
    </div>
  );
};

export default InputField;
