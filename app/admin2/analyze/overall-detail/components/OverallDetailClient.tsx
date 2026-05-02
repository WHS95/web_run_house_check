"use client";

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import FadeIn from "@/components/atoms/FadeIn";
import { AnimatedList, AnimatedItem } from "@/components/atoms/AnimatedList";
import { AdminBadge } from "@/app/admin2/components/ui";
import AdminProgressBar from "@/app/admin2/components/ui/AdminProgressBar";
import AdminFilterPill from "@/app/admin2/components/ui/AdminFilterPill";

/* ── 타입 ── */
interface MemberData {
  userId: string;
  name: string;
  attendCount: number;
  hostCount: number;
  attendanceRate: number;
  isActive: boolean;
}

interface Props {
  totalMembers: number;
  attendedCount: number;
  absentCount: number;
  members: MemberData[];
}

type Filter = "전체" | "참여" | "미참여";

const PAGE_SIZE = 50;

/* ── 멤버 카드 ── */
const MemberCard = memo(function MemberCard({
  member,
}: {
  member: MemberData;
}) {
  return (
    <div
      className={
        "bg-rh-bg-surface rounded-xl" +
        " px-3.5 py-3 flex items-center" +
        " gap-3" +
        (member.isActive ? "" : " opacity-50")
      }
    >
      {/* 아바타 */}
      <div
        className={
          "w-9 h-9 rounded-full" +
          " flex items-center" +
          " justify-center" +
          " text-white text-xs" +
          " font-semibold shrink-0" +
          (member.isActive ? " bg-rh-accent" : " bg-rh-bg-muted")
        }
      >
        {member.name.charAt(0)}
      </div>

      {/* 정보 */}
      <div className='flex-1 space-y-1.5'>
        {/* 상단: 이름 + 통계/뱃지 */}
        <div className={"flex items-center" + " justify-between"}>
          <span
            className={
              "font-semibold" +
              (member.isActive ? " text-white" : " text-rh-text-secondary")
            }
            style={{ fontSize: 13 }}
          >
            {member.name}
          </span>
          {member.isActive ? (
            <span className={"text-rh-accent"} style={{ fontSize: 11 }}>
              {member.attendCount}회{" · "}
              개설 {member.hostCount}회
            </span>
          ) : (
            <AdminBadge variant='muted'>미참여</AdminBadge>
          )}
        </div>

        {/* 프로그레스 바 */}
        <AdminProgressBar
          percent={member.isActive ? member.attendanceRate : 0}
        />

        {/* 출석률 */}
        <div className={"flex items-center" + " justify-between"}>
          <span className={"text-rh-text-muted"} style={{ fontSize: 10 }}>
            출석률
          </span>
          <span
            className={
              "font-semibold" +
              (member.isActive ? " text-rh-accent" : " text-rh-text-muted")
            }
            style={{ fontSize: 10 }}
          >
            {Math.round(member.attendanceRate)}%
          </span>
        </div>
      </div>
    </div>
  );
});

/* ── 메인 클라이언트 컴포넌트 ── */
export default function OverallDetailClient({
  totalMembers,
  attendedCount,
  absentCount,
  members,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>("전체");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const toggleExpanded = useCallback(() => setExpanded((v) => !v), []);

  const handleFilter = useCallback((f: Filter) => setFilter(f), []);

  /* 필터 + 검색 적용 */
  const filteredMembers = useMemo(() => {
    let list = members;
    if (filter === "참여") {
      list = list.filter((m) => m.isActive);
    } else if (filter === "미참여") {
      list = list.filter((m) => !m.isActive);
    }
    const q = deferredQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [members, filter, deferredQuery]);

  /* 필터/검색 변경 시 페이지 리셋 */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, deferredQuery]);

  const visibleMembers = useMemo(
    () => filteredMembers.slice(0, visibleCount),
    [filteredMembers, visibleCount],
  );
  const remaining = filteredMembers.length - visibleMembers.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  return (
    <FadeIn>
      <div className='space-y-4'>
        {/* 요약 카드 */}
        <div
          className={
            "bg-rh-bg-surface" +
            " rounded-xl p-3.5" +
            " grid grid-cols-3" +
            " text-center"
          }
        >
          <div>
            <p className={"text-rh-text-secondary"} style={{ fontSize: 11 }}>
              전체 인원
            </p>
            <p
              className={"text-white" + " font-bold mt-0.5"}
              style={{ fontSize: 15 }}
            >
              {totalMembers}명
            </p>
          </div>
          <div>
            <p className={"text-rh-text-secondary"} style={{ fontSize: 11 }}>
              참여 인원
            </p>
            <p
              className={"text-rh-accent" + " font-bold mt-0.5"}
              style={{ fontSize: 15 }}
            >
              {attendedCount}명
            </p>
          </div>
          <div>
            <p className={"text-rh-text-secondary"} style={{ fontSize: 11 }}>
              미참여
            </p>
            <p
              className={"text-rh-text-secondary" + " font-bold mt-0.5"}
              style={{ fontSize: 15 }}
            >
              {absentCount}명
            </p>
          </div>
        </div>

        {/* 멤버 섹션 토글 */}
        <button
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className={
            "w-full bg-rh-bg-surface" +
            " rounded-xl h-12 px-4" +
            " flex items-center" +
            " justify-between" +
            " active:bg-rh-bg-muted/40" +
            " transition-colors"
          }
        >
          <span className={"text-sm font-semibold" + " text-white"}>
            전체 멤버 ({totalMembers}명)
          </span>
          {expanded ? (
            <ChevronUp className={"w-5 h-5" + " text-rh-text-tertiary"} />
          ) : (
            <ChevronDown className={"w-5 h-5" + " text-rh-text-tertiary"} />
          )}
        </button>

        {/* 펼친 상태: 검색 + 필터 + 리스트 */}
        {expanded && (
          <>
            {/* 검색 인풋 */}
            <div className={"relative bg-rh-bg-surface" + " rounded-xl"}>
              <Search
                className={
                  "absolute left-3" +
                  " top-1/2" +
                  " -translate-y-1/2" +
                  " w-4 h-4" +
                  " text-rh-text-tertiary"
                }
              />
              <input
                type='search'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='이름 검색'
                aria-label='멤버 이름 검색'
                className={
                  "w-full bg-transparent" +
                  " h-10 pl-9 pr-3" +
                  " text-sm text-white" +
                  " placeholder:text-rh-text-tertiary" +
                  " focus:outline-none"
                }
              />
            </div>

            {/* 필터 */}
            <div className='flex gap-2'>
              {(["전체", "참여", "미참여"] as const).map((f) => (
                <AdminFilterPill
                  key={f}
                  label={f}
                  active={filter === f}
                  onClick={() => handleFilter(f)}
                />
              ))}
            </div>

            {/* 멤버 리스트 */}
            {visibleMembers.length > 0 ? (
              <>
                <AnimatedList className='space-y-2' maxStaggerSec={1}>
                  {visibleMembers.map((m) => (
                    <AnimatedItem key={m.userId}>
                      <MemberCard member={m} />
                    </AnimatedItem>
                  ))}
                </AnimatedList>
                {remaining > 0 && (
                  <button
                    onClick={handleLoadMore}
                    className={
                      "w-full h-11" +
                      " bg-rh-bg-surface" +
                      " rounded-xl" +
                      " text-sm" +
                      " font-medium" +
                      " text-rh-text-secondary" +
                      " active:bg-rh-bg-muted/40" +
                      " transition-colors"
                    }
                  >
                    더 보기 ({remaining}명 남음)
                  </button>
                )}
              </>
            ) : (
              <div
                className={
                  "text-center py-10" + " text-rh-text-tertiary" + " text-sm"
                }
              >
                해당 조건의 멤버가 없습니다.
              </div>
            )}
          </>
        )}
      </div>
    </FadeIn>
  );
}
