interface LocationParticipationData {
  locationName: string;
  participationRate: number;
  attendanceCount: number;
  totalAttendance: number;
  color: string;
}

interface LocationParticipationItemProps {
  item: LocationParticipationData;
}

function LocationParticipationItem({ item }: LocationParticipationItemProps) {
  const { locationName, participationRate, color } = item;

  return (
    <div className='flex justify-between items-center px-1 py-1'>
      <div className='flex flex-1 items-center space-x-3'>
        <div className='w-12 text-sm font-medium text-white'>
          {participationRate}%
        </div>
        <div className='flex flex-1 items-center space-x-1'>
          <span className='font-medium text-white min-w-[60px]'>
            {locationName}
          </span>
        </div>
        <div className='flex-1 h-2 bg-gray-200 rounded-full max-w-48'>
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${Math.min(participationRate, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

interface LocationChartProps {
  title: string;
  data: LocationParticipationData[];
  year: number;
  month: number;
}

export default function LocationChart({
  title,
  data,
  year,
  month,
}: LocationChartProps) {
  return (
    <div className='p-6 rounded-lg shadow-sm bg-basic-black-gray'>
      <div className='mb-6'>
        <h3 className='mb-1 text-lg font-semibold text-white'>{title}</h3>
      </div>

      <div className='space-y-1'>
        {data.length > 0 ? (
          data.map((item, index) => (
            <LocationParticipationItem key={item.locationName} item={item} />
          ))
        ) : (
          <div className='py-8 text-center text-white'>
            <p>해당 기간의 데이터가 없습니다.</p>
          </div>
        )}
      </div>

      {/* {data.length > 0 && (
        <div className='pt-4 mt-6 border-t border-gray-100'>
          <div className='flex justify-between text-xs text-gray-500'>
            <span>총 {data.length}개 장소</span>
          </div>
        </div>
      )} */}
    </div>
  );
}
