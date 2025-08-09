interface MemberAttendanceStatusData {
  totalActiveMembers: number;
  attendedMembers: number;
  attendanceRate: number;
  absentMembers: number;
  absentRate: number;
}

interface MemberAttendanceStatusChartProps {
  title: string;
  data: MemberAttendanceStatusData;
  year: number;
  month: number;
}

export default function MemberAttendanceStatusChart({
  title,
  data,
  year,
  month,
}: MemberAttendanceStatusChartProps) {
  const {
    totalActiveMembers,
    attendedMembers,
    attendanceRate,
    absentMembers,
    absentRate,
  } = data;

  return (
    <div className='p-6 rounded-lg  shadow-sm bg-basic-black-gray'>
      <div className='mb-6'>
        <h3 className='mb-1 text-lg font-semibold text-white'>{title}</h3>
        {/* <p className='text-sm text-gray-500'>
          {year}년 {month}월 멤버 출석 현황 분석
        </p> */}
      </div>

      {totalActiveMembers > 0 ? (
        <div className='space-y-6'>
          {/* 전체 현황 카드
          <div className='grid grid-cols-3 gap-4'>
            <div className='p-4 text-center bg-gray-50 rounded-lg'>
              <div className='text-2xl font-bold text-gray-900'>
                {totalActiveMembers}
              </div>
              <div className='text-sm text-gray-500'>전체 인원</div>
            </div>
            <div className='p-4 text-center bg-blue-50 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {attendedMembers}
              </div>
              <div className='text-sm text-gray-500'>출석 인원</div>
            </div>
            <div className='p-4 text-center bg-red-50 rounded-lg'>
              <div className='text-2xl font-bold text-red-600'>
                {absentMembers}
              </div>
              <div className='text-sm text-gray-500'>유령회원</div>
            </div>
          </div> */}

          {/* 출석율 비율 바 */}
          <div className='space-y-4'>
            <div>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm font-medium text-white'>출석율</span>
                <span className='text-sm font-bold text-basic-blue'>
                  {attendanceRate}%
                </span>
              </div>
              <div className='overflow-hidden w-full h-3 bg-gray-200 rounded-full'>
                <div
                  className='h-full bg-basic-blue transition-all duration-300 ease-out'
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
              <div className='flex justify-between mt-1 text-xs text-white'>
                <span>{attendedMembers}명 출석</span>
                <span>{absentMembers}명 미출석</span>
              </div>
            </div>

            {/* 유령회원 비율 바
            <div>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm font-medium text-gray-700'>
                  유령회원 비율
                </span>
                <span className='text-sm font-bold text-red-600'>
                  {absentRate}%
                </span>
              </div>
              <div className='overflow-hidden w-full h-3 bg-gray-200 rounded-full'>
                <div
                  className='h-full bg-red-500 transition-all duration-300 ease-out'
                  style={{ width: `${absentRate}%` }}
                ></div>
              </div>
            </div> */}
          </div>

          {/* 해석 메시지
          <div className='pt-4 border-t border-gray-100'>
            <div className='text-sm text-gray-600'>
              {attendanceRate >= 80 ? (
                <div className='flex items-center space-x-2'>
                  <span className='text-green-500'>●</span>
                  <span>매우 활발한 크루입니다! 👍</span>
                </div>
              ) : attendanceRate >= 60 ? (
                <div className='flex items-center space-x-2'>
                  <span className='text-yellow-500'>●</span>
                  <span>양호한 활동도를 보이고 있습니다.</span>
                </div>
              ) : attendanceRate >= 40 ? (
                <div className='flex items-center space-x-2'>
                  <span className='text-orange-500'>●</span>
                  <span>멤버들의 참여를 독려해보세요.</span>
                </div>
              ) : (
                <div className='flex items-center space-x-2'>
                  <span className='text-red-500'>●</span>
                  <span>멤버 활성화가 필요합니다.</span>
                </div>
              )}
            </div>
          </div> */}
        </div>
      ) : (
        <div className='py-8 text-center text-gray-500'>
          <p>활성 멤버가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
