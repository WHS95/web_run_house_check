import React from "react";
import Link from "next/link";
import NavigationIcon, {
  NavigationIconType,
} from "@/components/atoms/NavigationIcon";
import NavigationLabel from "@/components/atoms/NavigationLabel";

interface NavigationItemProps {
  type: NavigationIconType;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  type,
  label,
  href,
  isActive = false,
  onClick,
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className='flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1'
    >
      <div className='flex flex-col items-center gap-1'>
        <NavigationIcon type={type} isActive={isActive} size={20} />
        <NavigationLabel text={label} isActive={isActive} />
      </div>
    </Link>
  );
};

export default NavigationItem;
