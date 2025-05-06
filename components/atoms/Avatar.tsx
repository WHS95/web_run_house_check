import React from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number; // size in pixels
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User Avatar",
  size = 40,
}) => {
  const dimension = `${size}px`;

  return (
    <div
      className='relative rounded-full overflow-hidden bg-gray-100'
      style={{ width: dimension, height: dimension }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          layout='fill'
          objectFit='cover'
          className='h-full w-full'
        />
      ) : (
        <svg
          className='h-full w-full text-gray-300'
          fill='currentColor'
          viewBox='0 0 24 24'
        >
          <path d='M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z' />
        </svg>
      )}
    </div>
  );
};

export default Avatar;
