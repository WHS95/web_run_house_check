import React from "react";

interface InfoFieldProps {
  label: string;
  value: string;
}

const InfoField: React.FC<InfoFieldProps> = ({ label, value }) => (
  <div className='mb-4'>
    <label className='block mb-2 text-sm font-semibold text-black'>
      {label}
    </label>
    <div className='w-full p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm text-black/60'>
      {value}
    </div>
  </div>
);

interface MemberContactInfoProps {
  email: string;
  phone: string;
}

const MemberContactInfo: React.FC<MemberContactInfoProps> = ({
  email,
  phone,
}) => {
  return (
    <div className='mb-6'>
      <InfoField label='이메일' value={email} />
      <InfoField label='연락처' value={phone} />
    </div>
  );
};

export default MemberContactInfo;
export { InfoField }; // 다른 곳에서도 재사용 가능하도록 export
