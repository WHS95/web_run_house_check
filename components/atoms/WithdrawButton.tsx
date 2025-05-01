import React from "react";

interface WithdrawButtonProps {
  onClick: () => void;
}

const WithdrawButton: React.FC<WithdrawButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className='text-red-600 text-sm font-bold underline'
    >
      탈퇴
    </button>
  );
};

export default WithdrawButton;
