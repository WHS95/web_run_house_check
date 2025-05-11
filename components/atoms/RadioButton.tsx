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
        className={`w-5 h-5 rounded-full border-2 border-[#E3E3EA] mr-2 flex items-center justify-center 
        ${checked ? "bg-primary-blue border-primary-blue" : "bg-white"}
      `}
      >
        {checked && <span className='w-2 h-2 bg-white rounded-full'></span>}
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

export default RadioButton;
