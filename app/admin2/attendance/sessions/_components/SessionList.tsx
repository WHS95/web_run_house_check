'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { AnimatedList, AnimatedItem } from '@/components/atoms/AnimatedList';
import type {
    SessionListItem,
    SessionListVM,
} from '../_vm/loadSessionListVM';

interface SessionListProps {
    vm: SessionListVM;
}

function 날짜포맷(iso: string): string {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function 상태배지(item: SessionListItem) {
    if (item.endedAt) {
        return (
            <span className="px-2 py-0.5 rounded-full text-xs bg-rh-bg-muted text-rh-text-secondary">
                종료
            </span>
        );
    }
    return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-rh-accent/20 text-rh-accent">
            진행 중
        </span>
    );
}

export default function SessionList({ vm }: SessionListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const [startDate, setStartDate] = useState(vm.filter.startDate ?? '');
    const [endDate, setEndDate] = useState(vm.filter.endDate ?? '');
    const [label, setLabel] = useState(vm.filter.label ?? '');
    const [minMembers, setMinMembers] = useState(
        vm.filter.minMembers != null ? String(vm.filter.minMembers) : '',
    );

    const updateUrl = useCallback(
        (overrides: Record<string, string | undefined>) => {
            const sp = new URLSearchParams(searchParams.toString());
            for (const [k, v] of Object.entries(overrides)) {
                if (v == null || v === '') sp.delete(k);
                else sp.set(k, v);
            }
            startTransition(() => {
                router.push(`/admin2/attendance/sessions?${sp.toString()}`);
            });
        },
        [router, searchParams],
    );

    const onApplyFilter = useCallback(() => {
        updateUrl({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            label: label || undefined,
            minMembers: minMembers || undefined,
            page: '1',
        });
    }, [startDate, endDate, label, minMembers, updateUrl]);

    const onResetFilter = useCallback(() => {
        setStartDate('');
        setEndDate('');
        setLabel('');
        setMinMembers('');
        updateUrl({
            startDate: undefined,
            endDate: undefined,
            label: undefined,
            minMembers: undefined,
            page: '1',
        });
    }, [updateUrl]);

    const totalPages = Math.max(1, Math.ceil(vm.total / vm.pageSize));

    return (
        <div className="flex-1 px-4 pt-4 pb-4 space-y-4">
            {/* 필터 */}
            <div className="bg-rh-bg-surface rounded-[12px] p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-rh-bg-primary text-white text-sm rounded-lg px-3 py-2 border border-rh-border"
                        aria-label="시작일"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-rh-bg-primary text-white text-sm rounded-lg px-3 py-2 border border-rh-border"
                        aria-label="종료일"
                    />
                </div>
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="라벨 검색"
                    className="w-full bg-rh-bg-primary text-white text-sm rounded-lg px-3 py-2 border border-rh-border"
                />
                <input
                    type="number"
                    min={0}
                    value={minMembers}
                    onChange={(e) => setMinMembers(e.target.value)}
                    placeholder="최소 인원"
                    className="w-full bg-rh-bg-primary text-white text-sm rounded-lg px-3 py-2 border border-rh-border"
                />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onApplyFilter}
                        className="flex-1 bg-rh-accent text-white text-sm rounded-lg py-2 font-medium hover:bg-rh-accent-hover transition-colors"
                    >
                        필터 적용
                    </button>
                    <button
                        type="button"
                        onClick={onResetFilter}
                        className="px-4 bg-rh-bg-muted text-white text-sm rounded-lg py-2 hover:opacity-80 transition-opacity"
                    >
                        초기화
                    </button>
                </div>
            </div>

            {/* 결과 카운트 */}
            <div className="text-rh-text-secondary text-xs px-1">
                총 {vm.total}개 세션 (페이지 {vm.page}/{totalPages})
            </div>

            {/* 목록 */}
            {vm.items.length === 0 ? (
                <div className="bg-rh-bg-surface rounded-[12px] p-8 text-center text-rh-text-secondary text-sm">
                    조건에 맞는 세션이 없습니다.
                </div>
            ) : (
                <AnimatedList className="space-y-2" maxStaggerSec={0.6}>
                    {vm.items.map((item) => (
                        <AnimatedItem key={item.id}>
                            <Link
                                href={`/admin2/attendance/sessions/${item.id}`}
                                className="block bg-rh-bg-surface rounded-[12px] p-4 hover:bg-rh-bg-muted/40 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-white font-medium">
                                        {item.autoLabel || '라벨 없음'}
                                    </div>
                                    {상태배지(item)}
                                </div>
                                <div className="text-rh-text-secondary text-xs flex items-center gap-3">
                                    <span>{날짜포맷(item.startedAt)}</span>
                                    <span>·</span>
                                    <span>{item.memberCount}명</span>
                                    <span>·</span>
                                    <span>반경 {item.radiusM}m</span>
                                </div>
                            </Link>
                        </AnimatedItem>
                    ))}
                </AnimatedList>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        type="button"
                        disabled={vm.page <= 1}
                        onClick={() =>
                            updateUrl({ page: String(vm.page - 1) })
                        }
                        className="px-3 py-1 text-sm bg-rh-bg-surface text-white rounded-lg disabled:opacity-40"
                    >
                        이전
                    </button>
                    <span className="text-rh-text-secondary text-sm">
                        {vm.page} / {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={vm.page >= totalPages}
                        onClick={() =>
                            updateUrl({ page: String(vm.page + 1) })
                        }
                        className="px-3 py-1 text-sm bg-rh-bg-surface text-white rounded-lg disabled:opacity-40"
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
}
