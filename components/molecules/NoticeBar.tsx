import React from "react";

interface NoticeBarProps {
  noticeText: string;
}

const NoticeBar: React.FC<NoticeBarProps> = ({ noticeText }) => {
  console.log("NoticeBar 렌더링됨, noticeText:", noticeText);
  return (
    <div className='relative flex items-center gap-3 p-3 rounded-lg bg-basic-gray backdrop-blur-md'>
      <div className='px-2 py-1 font-normal text-white rounded-lg bg-basic-blue text-15'>
        공지
      </div>
      <p className='font-normal text-white text-15'>{noticeText}</p>
      {/* <div className='w-1.5 h-1.5 rounded-full bg-white ml-auto'></div> */}
    </div>
  );
};

export default NoticeBar;
