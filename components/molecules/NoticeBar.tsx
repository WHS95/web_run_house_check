import React from "react";

interface NoticeBarProps {
  noticeText: string;
}

const NoticeBar: React.FC<NoticeBarProps> = ({ noticeText }) => {
  return (
    <div className='flex items-center gap-3 p-3 rounded-notice bg-black/20 backdrop-blur-md relative'>
      <div className='px-2 py-1 rounded-notice bg-white/14 text-white text-15 font-normal'>
        공지
      </div>
      <p className='text-white text-15 font-normal'>{noticeText}</p>
      {/* <div className='w-1.5 h-1.5 rounded-full bg-white ml-auto'></div> */}
    </div>
  );
};

export default NoticeBar;
