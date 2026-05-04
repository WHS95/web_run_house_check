"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  memo,
  useDeferredValue,
} from "react";
import { useRouter } from "next/navigation";
import { SWRConfig, useSWRConfig } from "swr";
import { AnimatedList, AnimatedItem } from "@/components/atoms/AnimatedList";
import AdminSearchBar from "@/app/admin2/components/ui/AdminSearchBar";
import AdminBadge from "@/app/admin2/components/ui/AdminBadge";
import AdminSmallButton from "@/app/admin2/components/ui/AdminSmallButton";
import AdminFilterPill from "@/app/admin2/components/ui/AdminFilterPill";
import AdminCheckbox from "@/app/admin2/components/ui/AdminCheckbox";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import SortFilterSheet, {
  type SortKey,
  type SortDir,
  type StatusFilter,
} from "./SortFilterSheet";
import PeriodRangeSheet from "./PeriodRangeSheet";
import { UserForAdmin } from "@/lib/supabase/admin";
import { useAdminUsers } from "@/lib/admin2/hooks/useAdminUsers";
import { useAdmin } from "@/lib/admin2/context";
import { adminKey } from "@/lib/admin2/swr-keys";
import {
  getCrewUsersWithPeriodAction,
  bulkSuspendCrewUsersAction,
  type AdminUserPeriodInput,
} from "@/app/admin2/user/actions";

interface UserManagementProps {
  initialUsers: UserForAdmin[];
  crewId: string;
  fallback: Record<string, unknown>;
  gradeMap?: Record<string, { name: string; sort_order: number }>;
}

/* ── 초성 검색 유틸 ── */
const CHOSUNG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const getChosung = (str: string): string => {
  return Array.from(str)
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHOSUNG[Math.floor(code / 588)];
    })
    .join("");
};

const isChosungOnly = (str: string): boolean =>
  Array.from(str).every((ch) => CHOSUNG.includes(ch));

const matchesChosung = (text: string, query: string): boolean => {
  if (!isChosungOnly(query)) return false;
  const textChosung = getChosung(text);
  return textChosung.includes(query);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "정보 없음";
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

/* ── 기간 옵션 ── */
type PeriodKey = "all" | "30d" | "60d" | "90d" | "custom";

interface CustomRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

const PRESET_PERIOD_OPTIONS: { key: Exclude<PeriodKey, "custom">; label: string }[] =
  [
    { key: "all", label: "전체 기간" },
    { key: "30d", label: "최근 30일" },
    { key: "60d", label: "최근 60일" },
    { key: "90d", label: "최근 90일" },
  ];

const periodKeyToInput = (
  key: PeriodKey,
  custom: CustomRange | null,
): AdminUserPeriodInput => {
  if (key === "all") return { kind: "all" };
  if (key === "custom" && custom) {
    // 종료일 포함을 위해 다음날 0시를 to 로 (RPC 가 < p_to 사용)
    const toDate = new Date(`${custom.to}T00:00:00`);
    toDate.setDate(toDate.getDate() + 1);
    return {
      kind: "range",
      from: new Date(`${custom.from}T00:00:00`).toISOString(),
      to: toDate.toISOString(),
    };
  }
  const days = parseInt(key, 10);
  return { kind: "days", days };
};

const formatRangeChipLabel = (range: CustomRange | null): string => {
  if (!range) return "직접선택";
  const compact = (ymd: string) => ymd.slice(5).replace("-", ".");
  return `${compact(range.from)} ~ ${compact(range.to)}`;
};

/** 기간 필터 적용 시 "저조" 임계값 (이하 = 저조 강조). */
const LOW_PARTICIPATION_THRESHOLD = 2;

/* ── 유저 카드 ── */
const UserCard = memo(function UserCard({
  user,
  active,
  gradeMap,
  selectionMode,
  selected,
  periodActive,
  isSelf,
  onTap,
}: {
  user: UserForAdmin;
  active: boolean;
  gradeMap?: UserManagementProps["gradeMap"];
  selectionMode: boolean;
  selected: boolean;
  periodActive: boolean;
  isSelf: boolean;
  onTap: (user: UserForAdmin) => void;
}) {
  const gradeName =
    gradeMap &&
    user.crew_grade_id &&
    gradeMap[String(user.crew_grade_id)]?.name;

  const count = user.attendance_count ?? 0;
  const isLow = periodActive && count <= LOW_PARTICIPATION_THRESHOLD;
  const isSelectionDisabled = selectionMode && (isSelf || !active);

  const cardClass = isSelectionDisabled
    ? "bg-rh-bg-surface/40 opacity-50"
    : selectionMode && selected
      ? "bg-rh-accent/15 ring-1 ring-rh-accent/40"
      : "bg-rh-bg-surface";

  return (
    <button
      type='button'
      disabled={isSelectionDisabled}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 w-full text-left transition-colors ${cardClass}`}
      onClick={() => onTap(user)}
    >
      {/* 선택 체크박스 (선택불가 회원은 비어있는 박스로 표시) */}
      {selectionMode && (
        <div className='shrink-0 pointer-events-none'>
          {isSelectionDisabled ? (
            <div className='flex items-center justify-center w-5 h-5 rounded-[6px] border border-rh-border-subtle bg-rh-bg-muted/30' />
          ) : (
            <AdminCheckbox
              checked={selected}
              onCheckedChange={() => {}}
            />
          )}
        </div>
      )}

      {/* 아바타 */}
      <div
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
          active ? "bg-rh-accent" : "bg-rh-bg-muted"
        }`}
      >
        {(user.first_name || "?").charAt(0)}
      </div>

      {/* 이름 + 메타 */}
      <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
        <span className='flex items-center gap-1.5 text-sm font-medium text-white'>
          <span className='truncate'>
            {user.first_name || "이름 없음"}
          </span>
          {isSelf && (
            <span className='shrink-0 text-[10px] text-rh-text-tertiary'>
              (나)
            </span>
          )}
        </span>
        <span className='text-[11px] text-rh-text-tertiary truncate'>
          {user.last_attendance_date
            ? formatDate(user.last_attendance_date)
            : "참여 없음"}
          {" · "}
          <span
            className={
              isLow ? "text-rh-status-warning font-semibold" : ""
            }
          >
            {count}회
          </span>
        </span>
      </div>

      {/* 뱃지 (저조 표시 제거 — count 컬러로 충분) */}
      <div className='shrink-0'>
        {gradeName ? (
          <AdminBadge variant='accent'>{gradeName}</AdminBadge>
        ) : (
          <AdminBadge variant={active ? "outline" : "muted"}>
            {active ? "활성" : "비활성"}
          </AdminBadge>
        )}
      </div>
    </button>
  );
});

/* ── 점진적 렌더링 훅 ── */
const PAGE_SIZE = 20;

function useIncrementalRender<T>(items: T[], pageSize: number = PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 검색/필터 변경 시 리셋
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items.length, pageSize]);

  // IntersectionObserver로 무한 스크롤
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (visibleCount >= items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, visibleCount, pageSize]);

  return {
    visibleItems: items.slice(0, visibleCount),
    sentinelRef,
    hasMore: visibleCount < items.length,
  };
}

/* ── 메인 컴포넌트 ── */
export default function UserManagement({
  initialUsers,
  crewId,
  fallback,
  gradeMap,
}: UserManagementProps) {
  return (
    <SWRConfig value={{ fallback }}>
      <UserManagementInner
        initialUsers={initialUsers}
        crewId={crewId}
        gradeMap={gradeMap}
      />
    </SWRConfig>
  );
}

/* ── 애니메이션 제한 임계값 ── */
const ANIMATED_LIST_THRESHOLD = 20;

function UserManagementInner({
  initialUsers,
  crewId,
  gradeMap,
}: {
  initialUsers: UserForAdmin[];
  crewId: string;
  gradeMap?: UserManagementProps["gradeMap"];
}) {
  const router = useRouter();
  const { userId: meId } = useAdmin();
  const { mutate: globalMutate } = useSWRConfig();

  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [sortKey, setSortKey] = useState<SortKey>("lastAttendance");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [sheetOpen, setSheetOpen] = useState(false);

  /* 기간 필터 */
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const [rangeSheetOpen, setRangeSheetOpen] = useState(false);
  const [periodUsers, setPeriodUsers] = useState<UserForAdmin[] | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const periodRequestId = useRef(0);

  /* 선택 모드 / 일괄 처리 */
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* SWR (period === 'all' 일 때만 사용) */
  const { users: swrUsers } = useAdminUsers();

  const periodActive = period !== "all";

  const sourceUsers = useMemo<UserForAdmin[]>(() => {
    if (periodActive) return periodUsers ?? [];
    return swrUsers.length > 0 ? swrUsers : initialUsers;
  }, [periodActive, periodUsers, swrUsers, initialUsers]);

  /* 기간 변경 시 자동 정렬: 출석 횟수 오름차순 (저조한 사람이 위로) */
  const fetchPeriodUsers = useCallback(
    async (key: PeriodKey, custom: CustomRange | null) => {
      if (key === "all") {
        setPeriodUsers(null);
        return;
      }
      const reqId = ++periodRequestId.current;
      setPeriodLoading(true);
      const result = await getCrewUsersWithPeriodAction({
        crewId,
        period: periodKeyToInput(key, custom),
      });
      if (reqId !== periodRequestId.current) return;
      setPeriodLoading(false);
      if (result.success) {
        setPeriodUsers(result.data ?? []);
      } else {
        alert(result.message || "기간 조회에 실패했습니다.");
        setPeriod("all");
        setPeriodUsers(null);
      }
    },
    [crewId],
  );

  const applySortByPeriod = useCallback((key: PeriodKey) => {
    if (key === "all") {
      setSortKey("lastAttendance");
      setSortDir("desc");
    } else {
      setSortKey("count");
      setSortDir("asc");
    }
  }, []);

  const handlePresetPeriodChange = useCallback(
    (key: Exclude<PeriodKey, "custom">) => {
      if (key === period) return;
      setPeriod(key);
      setCustomRange(null);
      applySortByPeriod(key);
      fetchPeriodUsers(key, null);
    },
    [period, applySortByPeriod, fetchPeriodUsers],
  );

  const handleCustomRangeApply = useCallback(
    (range: CustomRange) => {
      setCustomRange(range);
      setPeriod("custom");
      setRangeSheetOpen(false);
      applySortByPeriod("custom");
      fetchPeriodUsers("custom", range);
    },
    [applySortByPeriod, fetchPeriodUsers],
  );

  const isUserActive = useCallback(
    (user: UserForAdmin) => user.status === "ACTIVE" || user.status === null,
    [],
  );

  /* 검색 (초성 검색 포함) */
  const matchesSearch = useCallback((user: UserForAdmin, term: string) => {
    if (!term) return true;
    const lower = term.toLowerCase();
    const name = user.first_name || "";
    const phone = user.phone || "";
    const email = user.email || "";

    if (
      name.toLowerCase().includes(lower) ||
      phone.includes(term) ||
      email.toLowerCase().includes(lower)
    ) {
      return true;
    }

    if (matchesChosung(name, term)) {
      return true;
    }

    return false;
  }, []);

  const filteredUsers = useMemo(() => {
    const searched = sourceUsers.filter((user) =>
      matchesSearch(user, deferredSearch),
    );
    const statused = searched.filter((user) => {
      const active = isUserActive(user);
      return (
        statusFilter === "전체" ||
        (statusFilter === "활성" && active) ||
        (statusFilter === "비활성" && !active)
      );
    });
    const m = sortDir === "asc" ? 1 : -1;
    return [...statused].sort((a, b) => {
      if (sortKey === "name") {
        return (a.first_name || "").localeCompare(b.first_name || "", "ko") * m;
      }
      if (sortKey === "lastAttendance") {
        const av = a.last_attendance_date || "";
        const bv = b.last_attendance_date || "";
        return (av < bv ? -1 : av > bv ? 1 : 0) * m;
      }
      return ((a.attendance_count ?? 0) - (b.attendance_count ?? 0)) * m;
    });
  }, [
    sourceUsers,
    deferredSearch,
    statusFilter,
    sortKey,
    sortDir,
    matchesSearch,
    isUserActive,
  ]);

  const statusCounts = useMemo(() => {
    const searched = sourceUsers.filter((user) =>
      matchesSearch(user, deferredSearch),
    );
    return {
      전체: searched.length,
      활성: searched.filter((u) => isUserActive(u)).length,
      비활성: searched.filter((u) => !isUserActive(u)).length,
    };
  }, [sourceUsers, deferredSearch, matchesSearch, isUserActive]);

  /* 선택/탭 동작 */
  const handleCardTap = useCallback(
    (user: UserForAdmin) => {
      if (selectionMode) {
        // 본인은 선택 불가
        if (user.id === meId) return;
        // 이미 비활성인 회원은 선택 불가
        if (!(user.status === "ACTIVE" || user.status === null)) return;

        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(user.id)) next.delete(user.id);
          else next.add(user.id);
          return next;
        });
      } else {
        router.push(`/admin2/user/${user.id}`);
      }
    },
    [router, selectionMode, meId],
  );

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkSuspend = useCallback(async () => {
    if (submitting) return;
    const reasonLabel = (() => {
      if (!periodActive) return undefined;
      if (period === "custom") {
        return `${formatRangeChipLabel(customRange)} 출석 저조`;
      }
      const preset = PRESET_PERIOD_OPTIONS.find((p) => p.key === period);
      return preset ? `${preset.label} 출석 저조` : undefined;
    })();
    setSubmitting(true);
    const result = await bulkSuspendCrewUsersAction({
      crewId,
      userIds: Array.from(selectedIds),
      reason: reasonLabel,
    });
    setSubmitting(false);
    setConfirmOpen(false);
    if (!result.success) {
      alert(result.message || "처리에 실패했습니다.");
      return;
    }
    // 성공 — 캐시 optimistic 업데이트 후 RSC refresh
    const targetIds = selectedIds;
    const markSuspended = (
      list: UserForAdmin[] | undefined
    ): UserForAdmin[] =>
      (list ?? []).map((u) =>
        targetIds.has(u.id) ? { ...u, status: "SUSPENDED" } : u
      );

    globalMutate(adminKey.users(crewId), markSuspended, {
      revalidate: false,
    });
    if (periodActive) {
      setPeriodUsers((prev) => markSuspended(prev ?? []));
    }

    setSelectedIds(new Set());
    setSelectionMode(false);

    // RSC 데이터도 갱신 (다음 SSR 시 반영되도록)
    router.refresh();

    alert(result.message || "처리가 완료되었습니다.");
  }, [
    submitting,
    crewId,
    selectedIds,
    period,
    customRange,
    periodActive,
    router,
    globalMutate,
  ]);

  // 점진적 렌더링 - 20개씩 로드
  const { visibleItems, sentinelRef, hasMore } =
    useIncrementalRender(filteredUsers);

  const displayCount = statusCounts[statusFilter as keyof typeof statusCounts];
  const selectedCount = selectedIds.size;

  return (
    <>
      {/* 검색 + 필터 (sticky) */}
      <div className='sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-10 bg-rh-bg-primary px-4 pt-4 pb-3 space-y-3'>
        <AdminSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder='검색어를 입력하세요'
        />

        {/* 기간 섹션 */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-[11px] font-semibold text-rh-text-tertiary uppercase tracking-wider'>
              참여 기간 조회
            </span>
            {periodActive && (
              <span className='text-[11px] text-rh-accent font-medium'>
                참여 적은 순으로 정렬
              </span>
            )}
          </div>
          <div className='flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [&::-webkit-scrollbar]:hidden'>
            {PRESET_PERIOD_OPTIONS.map((opt) => (
              <div key={opt.key} className='shrink-0'>
                <AdminFilterPill
                  label={opt.label}
                  active={period === opt.key}
                  onClick={() => handlePresetPeriodChange(opt.key)}
                />
              </div>
            ))}
            <div className='shrink-0'>
              <AdminFilterPill
                label={
                  period === "custom"
                    ? formatRangeChipLabel(customRange)
                    : "직접선택"
                }
                active={period === "custom"}
                onClick={() => setRangeSheetOpen(true)}
              />
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-[13px] text-rh-text-secondary'>
            활성 회원{" "}
            <span className='text-white font-medium'>
              {statusCounts.활성}명
            </span>
            {statusFilter !== "전체" && (
              <span className='ml-2 text-rh-text-tertiary'>
                (표시 {displayCount}명)
              </span>
            )}
            {periodLoading && (
              <span className='ml-2 text-rh-text-tertiary'>조회 중…</span>
            )}
          </span>

          <div className='flex items-center gap-2'>
            {selectionMode ? (
              <button
                type='button'
                onClick={exitSelectionMode}
                className='h-8 px-3 rounded-lg border border-rh-accent/60 text-rh-accent text-xs font-semibold active:opacity-70 transition-colors'
              >
                선택 종료
              </button>
            ) : (
              <button
                type='button'
                onClick={enterSelectionMode}
                className='h-8 px-3 rounded-lg bg-rh-bg-surface border border-rh-border text-white text-xs font-semibold active:opacity-70 transition-colors'
              >
                선택
              </button>
            )}
            <AdminSmallButton onClick={() => setSheetOpen(true)}>
              필터
            </AdminSmallButton>
          </div>
        </div>

        {/* 모드별 안내 (선택 ON 또는 기간 활성 시) */}
        {selectionMode ? (
          <div className='flex items-center gap-2 rounded-rh-md bg-rh-accent/10 border border-rh-accent/30 px-3 py-2'>
            <span className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rh-accent text-white text-[10px] font-bold'>
              {selectedCount}
            </span>
            <span className='text-[12px] text-rh-text-secondary'>
              {selectedCount === 0
                ? "비활성 처리할 회원을 탭해 선택하세요."
                : `${selectedCount}명이 선택됨. 하단 버튼으로 일괄 처리하세요.`}
            </span>
          </div>
        ) : (
          periodActive && (
            <p className='text-[11px] text-rh-text-tertiary px-1'>
              ℹ️ 기간 내 출석 횟수가 {LOW_PARTICIPATION_THRESHOLD}회 이하면 “저조”로 표시됩니다.
            </p>
          )
        )}
      </div>

      {/* 유저 리스트 */}
      <div
        className={`px-4 ${selectionMode && selectedCount > 0 ? "pb-24" : "pb-4"} ${periodLoading ? "opacity-60 transition-opacity" : ""}`}
      >
        {filteredUsers.length > 0 ? (
          visibleItems.length <= ANIMATED_LIST_THRESHOLD ? (
            <AnimatedList className='space-y-2'>
              {visibleItems.map((user) => (
                <AnimatedItem key={user.id}>
                  <UserCard
                    user={user}
                    active={isUserActive(user)}
                    gradeMap={gradeMap}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(user.id)}
                    periodActive={periodActive}
                    isSelf={user.id === meId}
                    onTap={handleCardTap}
                  />
                </AnimatedItem>
              ))}
            </AnimatedList>
          ) : (
            <div className='space-y-2'>
              {visibleItems.map((user) => (
                <div
                  key={user.id}
                  style={{
                    contentVisibility: "auto",
                    containIntrinsicSize: "auto 56px",
                  }}
                >
                  <UserCard
                    user={user}
                    active={isUserActive(user)}
                    gradeMap={gradeMap}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(user.id)}
                    periodActive={periodActive}
                    isSelf={user.id === meId}
                    onTap={handleCardTap}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className='py-8 text-center'>
            <p className='text-rh-text-secondary text-sm'>
              {periodActive
                ? "기간 내 활동한 회원이 없습니다."
                : "검색 결과가 없습니다."}
            </p>
          </div>
        )}
        {hasMore && <div ref={sentinelRef} className='h-px' />}
      </div>

      {/* 일괄 액션 바 (floating card) */}
      {selectionMode && selectedCount > 0 && (
        <div
          className='sticky z-20 px-3 pointer-events-none'
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          }}
        >
          <div className='pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl bg-rh-bg-surface border border-rh-border shadow-[0_12px_32px_rgba(0,0,0,0.45)]'>
            <span className='flex-1 text-sm text-white'>
              <span className='font-semibold text-rh-accent'>
                {selectedCount}
              </span>
              명 선택됨
            </span>
            <button
              type='button'
              onClick={exitSelectionMode}
              className='h-10 px-4 rounded-rh-md bg-rh-bg-primary text-rh-text-secondary text-sm font-medium active:opacity-70'
            >
              취소
            </button>
            <button
              type='button'
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className='h-10 px-4 rounded-rh-md bg-rh-accent text-white text-sm font-semibold active:opacity-70 disabled:opacity-50'
            >
              비활성
            </button>
          </div>
        </div>
      )}

      <SortFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        sortKey={sortKey}
        sortDir={sortDir}
        statusFilter={statusFilter}
        onApply={(next) => {
          setSortKey(next.sortKey);
          setSortDir(next.sortDir);
          setStatusFilter(next.statusFilter);
          setSheetOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (submitting) return;
          setConfirmOpen(false);
        }}
        onConfirm={handleBulkSuspend}
        title={`${selectedCount}명을 비활성 처리할까요?`}
        description={
          "선택한 회원의 크루 활동이 비활성화됩니다.\n나중에 회원 상세에서 다시 활성화할 수 있습니다."
        }
        cancelLabel='취소'
        confirmLabel={submitting ? "처리 중…" : "비활성 처리"}
        confirmVariant='danger'
        confirmDisabled={submitting}
      />

      <PeriodRangeSheet
        open={rangeSheetOpen}
        onClose={() => setRangeSheetOpen(false)}
        initialFrom={customRange?.from ?? null}
        initialTo={customRange?.to ?? null}
        onApply={handleCustomRangeApply}
      />
    </>
  );
}
