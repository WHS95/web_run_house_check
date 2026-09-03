"use client";
import { memo, useEffect, useState } from "react";
import AdminFilterPill from "@/app/admin2/components/ui/AdminFilterPill";
import DragSheet from "@/components/ui/DragSheet";

export type SortKey = "name" | "lastAttendance" | "count";
export type SortDir = "asc" | "desc";
export type StatusFilter = "전체" | "활성" | "비활성";

interface Props {
  open: boolean;
  onClose: () => void;
  sortKey: SortKey;
  sortDir: SortDir;
  statusFilter: StatusFilter;
  onApply: (next: {
    sortKey: SortKey;
    sortDir: SortDir;
    statusFilter: StatusFilter;
  }) => void;
}

const SORT_ROWS: { key: SortKey; label: string }[] = [
  { key: "name", label: "이름순" },
  { key: "lastAttendance", label: "최근 참여일순" },
  { key: "count", label: "출석 횟수순" },
];

const STATUS: StatusFilter[] = ["전체", "활성", "비활성"];

function DirButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 rounded-lg text-[11px] font-semibold transition-colors ${
        active
          ? "bg-rh-accent text-white"
          : "bg-rh-bg-surface text-rh-text-tertiary"
      }`}
    >
      {children}
    </button>
  );
}

const SortFilterSheet = memo(function SortFilterSheet({
  open,
  onClose,
  sortKey: initKey,
  sortDir: initDir,
  statusFilter: initStatus,
  onApply,
}: Props) {
  const [key, setKey] = useState<SortKey>(initKey);
  const [dir, setDir] = useState<SortDir>(initDir);
  const [status, setStatus] = useState<StatusFilter>(initStatus);

  useEffect(() => {
    if (open) {
      setKey(initKey);
      setDir(initDir);
      setStatus(initStatus);
    }
  }, [open, initKey, initDir, initStatus]);

  return (
    <DragSheet open={open} onClose={onClose} label='정렬 및 필터'>
      <div className='flex flex-col gap-5 p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]'>
            <h3 className='text-center text-base font-semibold text-white'>
              정렬 기준
            </h3>

            <div className='flex flex-col gap-2'>
              {SORT_ROWS.map((row) => (
                <div
                  key={row.key}
                  className='flex items-center justify-between rounded-xl bg-rh-bg-primary px-4 py-3'
                >
                  <span className='text-sm text-white'>{row.label}</span>
                  <div className='flex gap-2'>
                    <DirButton
                      active={key === row.key && dir === "asc"}
                      onClick={() => {
                        setKey(row.key);
                        setDir("asc");
                      }}
                    >
                      ↑ 오름
                    </DirButton>
                    <DirButton
                      active={key === row.key && dir === "desc"}
                      onClick={() => {
                        setKey(row.key);
                        setDir("desc");
                      }}
                    >
                      ↓ 내림
                    </DirButton>
                  </div>
                </div>
              ))}
            </div>

            <div className='flex flex-col gap-2'>
              <span className='text-sm font-medium text-white'>회원 상태</span>
              <div className='flex gap-2'>
                {STATUS.map((s) => (
                  <AdminFilterPill
                    key={s}
                    label={s}
                    active={status === s}
                    onClick={() => setStatus(s)}
                  />
                ))}
              </div>
            </div>

            <button
              className='w-full h-12 rounded-xl bg-rh-accent text-white text-sm font-semibold'
              onClick={() =>
                onApply({
                  sortKey: key,
                  sortDir: dir,
                  statusFilter: status,
                })
              }
            >
              적용
            </button>
      </div>
    </DragSheet>
  );
});

export default SortFilterSheet;
