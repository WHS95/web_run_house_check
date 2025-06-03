import React from "react";

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
        className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center transition-all duration-200
        ${
          checked
            ? "bg-basic-blue border-basic-blue shadow-md"
            : "bg-white border-gray-300 hover:border-gray-400"
        }
      `}
      >
        {checked && <span className='w-2.5 h-2.5 bg-white rounded-full'></span>}
      </span>
      <span
        className={`text-sm transition-colors duration-200 ${
          checked
            ? "font-semibold text-basic-blue"
            : "font-normal text-gray-600 hover:text-gray-800"
        }`}
      >
        {label}
      </span>
    </label>
  );
};

export default RadioButton;
