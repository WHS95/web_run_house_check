import type { LocationLeaderItem } from '../_vm/loadHealthDashboardVM';

interface Props {
    items: LocationLeaderItem[];
}

export default function LocationLeaderboard({ items }: Props) {
    return (
        <div>
            <div className="text-white font-semibold mb-2 px-1">
                인기 위치 TOP 5 (최근 30일)
            </div>
            {items.length === 0 ? (
                <div className="bg-rh-bg-surface rounded-[12px] p-6 text-center text-rh-text-secondary text-sm">
                    데이터가 없습니다.
                </div>
            ) : (
                <div className="bg-rh-bg-surface rounded-[12px] divide-y divide-rh-border">
                    {items.map((item, idx) => (
                        <div
                            key={`${item.label}-${idx}`}
                            className="flex items-center gap-3 p-3"
                        >
                            <div className="w-7 h-7 rounded-full bg-rh-accent/20 text-rh-accent text-sm flex items-center justify-center font-semibold">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-white text-sm truncate">
                                    {item.label || '미분류'}
                                </div>
                                <div className="text-rh-text-tertiary text-xs">
                                    세션 {item.sessionCount}회
                                </div>
                            </div>
                            <div className="text-rh-text-secondary text-sm font-medium">
                                {item.attendanceCount}명
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
