'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { AnimatedList, AnimatedItem } from '@/components/atoms/AnimatedList';
import {
    deleteSessionAction,
    relabelSessionAction,
    removeAttendanceFromSessionAction,
} from '../../actions';
import { searchCrewMembersForSessionAction } from '../actions';
import type { SessionDetailVM } from '../_vm/loadSessionDetailVM';
import MemberSearchDialog from './MemberSearchDialog';

interface Props {
    vm: SessionDetailVM;
}

function 시간포맷(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const ACTION_LABEL: Record<string, string> = {
    add: '멤버 추가',
    remove: '멤버 제거',
    relabel: '라벨 변경',
    delete_session: '세션 삭제',
};

export default function SessionCorrectionPanel({ vm }: Props) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [pendingMember, setPendingMember] = useState<string | null>(null);
    const [showRelabel, setShowRelabel] = useState(false);
    const [labelDraft, setLabelDraft] = useState(vm.autoLabel ?? '');
    const [showMemberSearch, setShowMemberSearch] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const refreshPage = useCallback(() => {
        router.refresh();
    }, [router]);

    const onRemove = useCallback(
        (recordId: string) => {
            if (!confirm('이 멤버를 세션에서 제거하시겠습니까?')) return;
            setErrorMsg(null);
            setPendingMember(recordId);
            startTransition(async () => {
                try {
                    const res = await removeAttendanceFromSessionAction({
                        sessionId: vm.id,
                        recordId,
                    });
                    if (!res.success) {
                        setErrorMsg(res.message ?? '제거에 실패했습니다.');
                    } else {
                        refreshPage();
                    }
                } catch (e) {
                    setErrorMsg(e instanceof Error ? e.message : '제거 실패');
                } finally {
                    setPendingMember(null);
                }
            });
        },
        [vm.id, refreshPage],
    );

    const onRelabel = useCallback(() => {
        setErrorMsg(null);
        const trimmed = labelDraft.trim();
        if (!trimmed) {
            setErrorMsg('라벨을 입력해주세요.');
            return;
        }
        startTransition(async () => {
            try {
                const res = await relabelSessionAction({
                    sessionId: vm.id,
                    label: trimmed,
                });
                if (!res.success) {
                    setErrorMsg(res.message ?? '변경 실패');
                } else {
                    setShowRelabel(false);
                    refreshPage();
                }
            } catch (e) {
                setErrorMsg(e instanceof Error ? e.message : '변경 실패');
            }
        });
    }, [vm.id, labelDraft, refreshPage]);

    const onDelete = useCallback(() => {
        setErrorMsg(null);
        startTransition(async () => {
            try {
                const res = await deleteSessionAction({ sessionId: vm.id });
                if (!res.success) {
                    setErrorMsg(res.message ?? '삭제 실패');
                } else {
                    router.push('/admin2/attendance/sessions');
                }
            } catch (e) {
                setErrorMsg(e instanceof Error ? e.message : '삭제 실패');
            }
        });
    }, [vm.id, router]);

    return (
        <div className="flex-1 px-4 pt-4 pb-4 space-y-4">
            {/* 세션 헤더 */}
            <div className="bg-rh-bg-surface rounded-[12px] p-4 space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-white font-semibold text-lg">
                            {vm.autoLabel || '라벨 없음'}
                        </div>
                        <div className="text-rh-text-secondary text-xs mt-0.5">
                            {시간포맷(vm.startedAt)}
                            {vm.endedAt
                                ? ` ~ ${시간포맷(vm.endedAt)}`
                                : ' (진행 중)'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setLabelDraft(vm.autoLabel ?? '');
                            setShowRelabel(true);
                        }}
                        className="text-rh-accent text-sm"
                    >
                        라벨 수정
                    </button>
                </div>
                <div className="text-rh-text-tertiary text-xs flex items-center gap-2">
                    <span>{vm.members.length}명 출석</span>
                    <span>·</span>
                    <span>반경 {vm.radiusM}m</span>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-rh-status-error/20 text-rh-status-error text-sm rounded-lg p-3">
                    {errorMsg}
                </div>
            )}

            {/* 멤버 추가 버튼 */}
            <button
                type="button"
                onClick={() => setShowMemberSearch(true)}
                className="w-full bg-rh-accent text-white text-sm rounded-[12px] py-3 font-medium hover:bg-rh-accent-hover transition-colors"
            >
                + 멤버 추가
            </button>

            {/* 멤버 목록 */}
            <div>
                <div className="text-white font-semibold mb-2 px-1">
                    출석자 목록
                </div>
                {vm.members.length === 0 ? (
                    <div className="bg-rh-bg-surface rounded-[12px] p-8 text-center text-rh-text-secondary text-sm">
                        출석자가 없습니다.
                    </div>
                ) : (
                    <AnimatedList className="space-y-2" maxStaggerSec={0.5}>
                        {vm.members.map((m) => (
                            <AnimatedItem key={m.userId}>
                                <div className="bg-rh-bg-surface rounded-[12px] p-3 flex items-center gap-3">
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
                                        <div className="text-white text-sm">
                                            {m.userName}
                                        </div>
                                        <div className="text-rh-text-tertiary text-xs">
                                            {시간포맷(m.joinedAt)}
                                            {m.status === 'manual' &&
                                                ' · 수동 추가'}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onRemove(m.attendanceRecordId)
                                        }
                                        disabled={
                                            pendingMember === m.attendanceRecordId
                                        }
                                        className="text-rh-status-error text-xs px-3 py-1.5 rounded-lg hover:bg-rh-status-error/10 transition-colors disabled:opacity-50"
                                    >
                                        제거
                                    </button>
                                </div>
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                )}
            </div>

            {/* 감사 로그 */}
            {vm.auditLog.length > 0 && (
                <div>
                    <div className="text-white font-semibold mb-2 px-1">
                        최근 변경 이력
                    </div>
                    <div className="bg-rh-bg-surface rounded-[12px] divide-y divide-rh-border">
                        {vm.auditLog.map((log) => (
                            <div key={log.id} className="p-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-rh-accent">
                                        {ACTION_LABEL[log.action] ?? log.action}
                                    </span>
                                    <span className="text-rh-text-tertiary">
                                        {시간포맷(log.createdAt)}
                                    </span>
                                </div>
                                <div className="text-rh-text-secondary mt-0.5">
                                    {log.adminName ?? '관리자'}
                                    {log.targetUserName &&
                                        ` → ${log.targetUserName}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 위험 작업 */}
            <div className="pt-2">
                <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-rh-status-error/20 text-rh-status-error text-sm rounded-[12px] py-3 font-medium hover:bg-rh-status-error/30 transition-colors"
                >
                    세션 삭제
                </button>
            </div>

            {/* 라벨 수정 모달 */}
            {showRelabel && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                    onClick={() => setShowRelabel(false)}
                    role="presentation"
                >
                    <div
                        className="bg-rh-bg-surface w-full max-w-sm rounded-[20px] p-4"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <h2 className="text-white font-semibold mb-3">
                            라벨 수정
                        </h2>
                        <input
                            type="text"
                            value={labelDraft}
                            onChange={(e) => setLabelDraft(e.target.value)}
                            placeholder="예: 한강 러닝"
                            maxLength={50}
                            className="w-full bg-rh-bg-primary text-white text-sm rounded-lg px-3 py-2 border border-rh-border mb-3"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowRelabel(false)}
                                className="flex-1 bg-rh-bg-muted text-white text-sm rounded-lg py-2"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={onRelabel}
                                className="flex-1 bg-rh-accent text-white text-sm rounded-lg py-2 font-medium"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 삭제 확인 모달 */}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                    onClick={() => setShowDeleteConfirm(false)}
                    role="presentation"
                >
                    <div
                        className="bg-rh-bg-surface w-full max-w-sm rounded-[20px] p-4"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <h2 className="text-white font-semibold mb-2">
                            세션을 삭제하시겠습니까?
                        </h2>
                        <p className="text-rh-text-secondary text-sm mb-3">
                            이 세션과 연결된 출석 기록은 세션과 분리되며,
                            이 작업은 되돌릴 수 없습니다.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-rh-bg-muted text-white text-sm rounded-lg py-2"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={onDelete}
                                className="flex-1 bg-rh-status-error text-white text-sm rounded-lg py-2 font-medium"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MemberSearchDialog
                open={showMemberSearch}
                onClose={() => setShowMemberSearch(false)}
                sessionId={vm.id}
                excludeUserIds={vm.members.map((m) => m.userId)}
                fetchCandidates={async (q) => {
                    const res = await searchCrewMembersForSessionAction({
                        sessionId: vm.id,
                        query: q,
                    });
                    return res.success && res.data ? res.data : [];
                }}
                onSuccess={refreshPage}
            />
        </div>
    );
}
