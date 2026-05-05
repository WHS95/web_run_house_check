import type { MemberPatternItem } from '../_vm/loadHealthDashboardVM';

interface Props {
    items: MemberPatternItem[];
}

function 미니바(weeklyCounts: number[]): JSX.Element {
    const max = Math.max(1, ...weeklyCounts);
    return (
        <div className="flex items-end gap-[2px] h-6">
            {weeklyCounts
                .slice()
                .reverse()
                .map((c, i) => {
                    const h = Math.max(2, Math.round((c / max) * 24));
                    return (
                        <div
                            key={i}
                            className="w-2 bg-rh-accent/70 rounded-sm"
                            style={{ height: `${h}px` }}
                            title={`${weeklyCounts.length - i}주차: ${c}회`}
                        />
                    );
                })}
        </div>
    );
}

export default function MemberPatternList({ items }: Props) {
    return (
        <div>
            <div className="text-white font-semibold mb-2 px-1">
                멤버 활동 패턴 (최근 4주)
            </div>
            {items.length === 0 ? (
                <div className="bg-rh-bg-surface rounded-[12px] p-6 text-center text-rh-text-secondary text-sm">
                    출석 기록이 없습니다.
                </div>
            ) : (
                <div className="bg-rh-bg-surface rounded-[12px] divide-y divide-rh-border">
                    {items.map((m) => (
                        <div
                            key={m.userId}
                            className="flex items-center gap-3 p-3"
                        >
                            <div className="w-9 h-9 rounded-full bg-rh-bg-muted overflow-hidden flex-shrink-0">
                                {m.profileImageUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={m.profileImageUrl}
                                        alt={m.userName}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-white text-sm truncate">
                                    {m.userName}
                                </div>
                                <div className="text-rh-text-tertiary text-xs">
                                    최근 30일 {m.last30dAttendance}회 출석
                                </div>
                            </div>
                            {미니바(m.weeklyCounts)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
