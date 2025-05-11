import React from "react";
import Select, { StylesConfig } from "react-select";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectFieldProps {
  label: string;
  value: string;
  options: Option[];
  name: string;
  placeholder?: string;
  onChange: (value: string, name: string) => void;
  isDisabled?: boolean;
}

const SearchableSelectField: React.FC<SearchableSelectFieldProps> = ({
  label,
  value,
  options,
  name,
  placeholder = "검색...",
  onChange,
  isDisabled = false,
}) => {
  const selectedOption = options.find((option) => option.value === value);

  const handleChange = (option: Option | null) => {
    if (option) {
      onChange(option.value, name);
    }
  };

  // 커스텀 스타일 - 폼 디자인과 일치하도록 설정
  const customStyles: StylesConfig<Option, false> = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#3B82F6" : "#EAEAF3",
      boxShadow: state.isFocused ? "0 0 0 1px #3B82F6" : "none",
      backgroundColor: "#F8F8FD",
      borderRadius: "0.375rem",
      minHeight: "46px", // 폼 입력과 같은 높이
      "&:hover": {
        borderColor: "#3B82F6",
      },
      fontSize: "0.875rem",
      padding: "0",
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "6px 12px", // 폼 입력과 일치하는 패딩
    }),
    input: (provided) => ({
      ...provided,
      margin: "0",
      padding: "0",
      color: "#333",
      fontSize: "0.875rem",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#9CA3AF",
      "&:hover": {
        color: "#3B82F6",
      },
      padding: "8px",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#3B82F6"
        : state.isFocused
        ? "#EBF5FF"
        : "white",
      color: state.isSelected ? "white" : "#333",
      fontSize: "0.875rem",
      cursor: "pointer",
      padding: "10px 12px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "rgba(0, 0, 0, 0.6)",
      fontSize: "0.875rem",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#333",
      fontSize: "0.875rem",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 10,
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      borderRadius: "0.375rem",
      overflow: "hidden",
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      fontSize: "0.875rem",
      color: "#6B7280",
    }),
  };

  return (
    <div className='mb-4'>
      <label className='block mb-2 text-sm font-semibold'>{label}</label>
      <Select
        value={selectedOption}
        onChange={(newValue) => handleChange(newValue as Option)}
        options={options}
        placeholder={placeholder}
        isDisabled={isDisabled}
        styles={customStyles}
        className='react-select-container'
        classNamePrefix='react-select'
        isSearchable={true}
        menuPlacement='auto'
        maxMenuHeight={200}
        noOptionsMessage={() => "검색 결과가 없습니다"}
      />
    </div>
  );
};

export default SearchableSelectField;
