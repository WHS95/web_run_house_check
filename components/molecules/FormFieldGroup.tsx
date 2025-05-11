import React from "react";
import RadioButton from "../atoms/RadioButton";

interface RadioGroupProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  name,
  options,
  selectedValue,
  onChange,
}) => {
  return (
    <div className='mb-4'>
      <label className='block mb-2 text-sm font-semibold'>{label}</label>
      <div className='flex'>
        {options.map((option) => (
          <RadioButton
            key={option.value}
            label={option.label}
            value={option.value}
            name={name}
            checked={selectedValue === option.value}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
};

export default RadioGroup;
