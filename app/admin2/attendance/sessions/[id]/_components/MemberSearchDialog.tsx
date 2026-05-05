'use client';

import { useEffect, useState, useTransition } from 'react';
import { addAttendanceToSessionAction } from '../../actions';

interface UserCandidate {
    id: string;
    name: string;
    profile_image_url: string | null;
}

interface MemberSearchDialogProps {
    open: boolean;
    onClose: () => void;
    sessionId: string;
    excludeUserIds: string[];
    fetchCandidates: (query: string) => Promise<UserCandidate[]>;
    onSuccess: () => void;
}

export default function MemberSearchDialog({
    open,
    onClose,
    sessionId,
    excludeUserIds,
    fetchCandidates,
    onSuccess,
}: MemberSearchDialogProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserCandidate[]>([]);
    const [, startTransition] = useTransition();
    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        const run = async () => {
            const list = await fetchCandidates(query);
            if (!cancelled) {
                setResults(
                    list.filter((u) => !excludeUserIds.includes(u.id)),
                );
            }
        };
        const timer = setTimeout(run, 200);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [open, query, fetchCandidates, excludeUserIds]);

    if (!open) return null;

    const onAdd = (userId: string) => {
        setError(null);
        setIsAdding(userId);
        startTransition(async () => {
            try {
                const res = await addAttendanceToSessionAction({
                    sessionId,
                    userId,
                });
                if (!res.success) {
                    setError(res.message ?? '추가에 실패했습니다.');
                } else {
                    onSuccess();
                    onClose();
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : '추가 실패');
            } finally {
                setIsAdding(null);
            }
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="bg-rh-bg-surface w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] p-4 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-semibold">멤버 추가</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-rh-text-secondary text-sm"
                    >
                        닫기
                    </button>
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="이름 검색"
                    className="bg-rh-bg-primary text-white text-sm rounded-lg px-3 py-2 border border-rh-border mb-3"
                    autoFocus
                />
                {error && (
                    <div className="text-rh-status-error text-xs mb-2">
                        {error}
                    </div>
                )}
                <div className="overflow-y-auto flex-1 space-y-1">
                    {results.length === 0 ? (
                        <div className="text-rh-text-secondary text-sm text-center py-8">
                            결과가 없습니다.
                        </div>
                    ) : (
                        results.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => onAdd(u.id)}
                                disabled={isAdding === u.id}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-rh-bg-muted/40 transition-colors disabled:opacity-50"
                            >
                                <div className="w-9 h-9 rounded-full bg-rh-bg-muted overflow-hidden flex-shrink-0">
                                    {u.profile_image_url && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={u.profile_image_url}
                                            alt={u.name}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <span className="text-white text-sm flex-1 text-left">
                                    {u.name}
                                </span>
                                {isAdding === u.id && (
                                    <span className="text-rh-text-secondary text-xs">
                                        추가 중…
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
