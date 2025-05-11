import React from "react";

interface DateFieldProps {
  label: string;
  value: string;
  name?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  name = "date",
  onChange,
}) => {
  return (
    <div className='mb-4'>
      <label className='block mb-2 text-sm font-semibold'>{label}</label>
      <input
        type='date'
        name={name}
        value={value}
        onChange={onChange}
        className='w-full p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm placeholder-black/60 focus:outline-none focus:ring-1 focus:ring-primary-blue'
      />
    </div>
  );
};

export default DateField;
