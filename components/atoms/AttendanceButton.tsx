import React from "react";

interface AttendanceButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const AttendanceButton: React.FC<AttendanceButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-md text-white font-semibold transition-colors duration-200 
        ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }
      `}
    >
      출석
    </button>
  );
};

export default AttendanceButton;
