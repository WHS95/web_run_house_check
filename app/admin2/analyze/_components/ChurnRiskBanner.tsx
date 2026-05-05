import type { ChurnRiskMember } from '../_vm/loadHealthDashboardVM';

interface Props {
    churnRisk: ChurnRiskMember[];
    onboardingRisk: ChurnRiskMember[];
}

function 멤버칩(m: ChurnRiskMember) {
    return (
        <div
            key={m.userId}
            className="flex items-center gap-2 bg-rh-bg-surface rounded-full pl-1 pr-3 py-1"
        >
            <div className="w-6 h-6 rounded-full bg-rh-bg-muted overflow-hidden flex-shrink-0">
                {m.profileImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={m.profileImageUrl}
                        alt={m.userName}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
            <span className="text-white text-xs">{m.userName}</span>
        </div>
    );
}

export default function ChurnRiskBanner({
    churnRisk,
    onboardingRisk,
}: Props) {
    if (churnRisk.length === 0 && onboardingRisk.length === 0) {
        return (
            <div className="bg-rh-bg-surface rounded-[12px] p-4">
                <div className="text-rh-status-success text-sm font-medium mb-1">
                    ⚡ 모두 건강해요
                </div>
                <div className="text-rh-text-secondary text-xs">
                    이탈/온보딩 위험 멤버가 없습니다.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {churnRisk.length > 0 && (
                <div className="bg-rh-status-error/10 border border-rh-status-error/30 rounded-[12px] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-rh-status-error text-sm font-semibold">
                            이탈 위험 ({churnRisk.length}명)
                        </div>
                    </div>
                    <p className="text-rh-text-secondary text-xs mb-3">
                        과거 정기 참여하던 멤버 중 최근 출석이 끊긴 분들입니다.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {churnRisk.slice(0, 10).map((m) => 멤버칩(m))}
                        {churnRisk.length > 10 && (
                            <div className="text-rh-text-tertiary text-xs flex items-center px-2">
                                외 {churnRisk.length - 10}명
                            </div>
                        )}
                    </div>
                </div>
            )}

            {onboardingRisk.length > 0 && (
                <div className="bg-rh-status-warning/10 border border-rh-status-warning/30 rounded-[12px] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-rh-status-warning text-sm font-semibold">
                            온보딩 위험 ({onboardingRisk.length}명)
                        </div>
                    </div>
                    <p className="text-rh-text-secondary text-xs mb-3">
                        가입 후 정착에 어려움을 겪는 신규 멤버입니다.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {onboardingRisk.slice(0, 10).map((m) => 멤버칩(m))}
                        {onboardingRisk.length > 10 && (
                            <div className="text-rh-text-tertiary text-xs flex items-center px-2">
                                외 {onboardingRisk.length - 10}명
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
