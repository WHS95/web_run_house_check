import React from "react";
import Image from "next/image";

interface ChevronRightProps {
  className?: string;
}

const ChevronRight: React.FC<ChevronRightProps> = ({ className = "" }) => {
  return (
    <div className={className}>
      <Image
        src='/assets/chevron-right.svg'
        alt='더 보기'
        width={24}
        height={24}
      />
    </div>
  );
};

export default ChevronRight;
