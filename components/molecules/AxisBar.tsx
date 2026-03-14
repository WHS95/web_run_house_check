interface DayParticipationItem {
    dayName: string;
    dayIndex: number;
    participationRate: number;
    totalMembers: number;
    color: string;
}

interface DayParticipationItemProps {
    item: DayParticipationItem;
}

export default function DayParticipationItem({
    item,
}: DayParticipationItemProps) {
    const { dayName, participationRate, color } = item;

    return (
        <div className='flex justify-between items-center px-1 py-1'>
            <div className='flex flex-1 items-center space-x-3'>
                <div className='w-12 text-sm font-medium text-white'>
                    {participationRate}%
                </div>
                <div className='flex flex-1 items-center space-x-1'>
                    <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: color }}
                    />
                    <span className='font-medium text-white min-w-[60px]'>{dayName}</span>
                </div>
                <div className='flex-1 h-2 bg-rh-bg-muted rounded-full max-w-48'>
                    <div
                        className='h-2 rounded-full'
                        style={{
                            width: `${Math.min(participationRate, 100)}%`,
                            backgroundColor: color,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
