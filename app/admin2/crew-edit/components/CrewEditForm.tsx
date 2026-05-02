"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import { Camera } from "lucide-react";
import FadeIn from "@/components/atoms/FadeIn";
import { AdminLabeledInput, AdminDivider } from "@/app/admin2/components/ui";
import LogoCropModal from "./LogoCropModal";

interface CrewEditFormProps {
  crewId: string;
  initialData: {
    name: string;
    description: string;
    region: string;
    maxMembers: number;
    createdAt: string;
    currentMembers: number;
    logoUrl: string | null;
  };
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "정보 없음";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}.${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * crewLogos public URL에서 storage 내부 경로(`crewId/filename.png`)를 추출.
 * 버킷 public URL 형식: `.../storage/v1/object/public/crewLogos/{path}`
 */
const extractCrewLogoPath = (publicUrl: string): string | null => {
  const marker = "/crewLogos/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  const tail = publicUrl.slice(idx + marker.length);
  // 쿼리/프래그먼트 제거
  const clean = tail.split(/[?#]/)[0];
  return clean || null;
};

const CrewEditForm = memo(function CrewEditForm({
  crewId,
  initialData,
}: CrewEditFormProps) {
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [region, setRegion] = useState(initialData.region);
  const [maxMembers, setMaxMembers] = useState(String(initialData.maxMembers));
  const [saving, setSaving] = useState(false);

  // 로고 업로드/크롭 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData.logoUrl);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // 크롭 소스가 바뀔 때 기존 object URL 해제
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const handleLogoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }
      const url = URL.createObjectURL(file);
      setCropSrc(url);
      setCropOpen(true);
      // 동일 파일 재선택 허용
      e.target.value = "";
    },
    [],
  );

  const handleCropClose = useCallback(() => {
    setCropOpen(false);
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  }, [cropSrc]);

  const handleCropConfirm = useCallback(
    async (blob: Blob) => {
      setCropOpen(false);
      setUploadingLogo(true);
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const filePath = `${crewId}/${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("crewLogos")
          .upload(filePath, blob, {
            contentType: "image/png",
            upsert: true,
          });
        if (uploadError) {
          console.error("[crew-edit] logo upload failed:", uploadError);
          alert(`로고 업로드에 실패했습니다.\n${uploadError.message ?? ""}`);
          return;
        }
        const { data: publicData } = supabase.storage
          .from("crewLogos")
          .getPublicUrl(filePath);
        const publicUrl = publicData.publicUrl;

        const { error: updateError } = await supabase
          .schema("attendance")
          .from("crews")
          .update({ profile_image_url: publicUrl })
          .eq("id", crewId);
        if (updateError) {
          console.error("[crew-edit] logo DB update failed:", updateError);
          alert(`로고 저장에 실패했습니다.\n${updateError.message ?? ""}`);
          return;
        }

        // 기존 로고 파일 삭제 (새 파일이 아닌 경우만)
        const prevUrl = logoUrl;
        if (prevUrl && prevUrl !== publicUrl) {
          const prevPath = extractCrewLogoPath(prevUrl);
          if (prevPath && prevPath !== filePath) {
            const { error: removeError } = await supabase.storage
              .from("crewLogos")
              .remove([prevPath]);
            if (removeError) {
              // 이전 파일 삭제 실패는 치명적이지 않음 — 로그만 남김
              console.error("[crew-edit] old logo remove failed:", removeError);
            }
          }
        }

        setLogoUrl(publicUrl);
      } catch (err) {
        console.error("[crew-edit] unexpected logo error:", err);
        const message = err instanceof Error ? err.message : "알 수 없는 오류";
        alert(`오류가 발생했습니다.\n${message}`);
      } finally {
        setUploadingLogo(false);
        if (cropSrc) {
          URL.revokeObjectURL(cropSrc);
          setCropSrc(null);
        }
      }
    },
    [crewId, cropSrc, logoUrl],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase
        .schema("attendance")
        .from("crews")
        .update({
          name: name.trim(),
          description: description.trim(),
          region: region.trim(),
          max_members: parseInt(maxMembers) || 50,
        })
        .eq("id", crewId);

      if (error) {
        console.error("[crew-edit] save failed:", error);
        alert(`크루 정보 수정에 실패했습니다.\n${error.message ?? ""}`);
        return;
      }
      alert("크루 정보가 수정되었습니다.");
    } catch (err) {
      console.error("[crew-edit] unexpected save error:", err);
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      alert(`오류가 발생했습니다.\n${message}`);
    } finally {
      setSaving(false);
    }
  }, [crewId, name, description, region, maxMembers]);

  return (
    <FadeIn>
      <div className='flex-1 px-4 pt-4 pb-8 space-y-6'>
        {/* 로고 영역 */}
        <div className='flex flex-col items-center gap-2 py-2'>
          <button
            type='button'
            onClick={handleLogoClick}
            disabled={uploadingLogo}
            className='relative w-16 h-16 rounded-full bg-rh-bg-surface flex items-center justify-center overflow-hidden disabled:opacity-50'
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt='크루 로고'
                className='w-full h-full object-cover'
              />
            ) : (
              <Camera size={24} className='text-rh-text-secondary' />
            )}
          </button>
          <span className='text-xs font-medium text-rh-accent'>
            {uploadingLogo ? "업로드 중..." : "크루 로고 변경"}
          </span>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
          />
        </div>

        {/* 편집 폼 */}
        <div className='space-y-4'>
          <AdminLabeledInput
            label='크루명'
            value={name}
            onChange={setName}
            placeholder='크루 이름을 입력하세요'
          />
          <AdminLabeledInput
            label='크루 소개'
            value={description}
            onChange={setDescription}
            placeholder='크루 소개를 입력하세요'
          />
          <AdminLabeledInput
            label='활동 지역'
            value={region}
            onChange={setRegion}
            placeholder='활동 지역을 입력하세요'
          />
          <AdminLabeledInput
            label='최대 인원'
            value={maxMembers}
            onChange={setMaxMembers}
            placeholder='50'
            type='number'
          />
        </div>

        {/* 크루 정보 (읽기 전용) */}
        <div className='space-y-3'>
          <span className='text-xs font-semibold text-rh-text-tertiary uppercase tracking-widest'>
            크루 정보
          </span>
          <AdminDivider />
          <div className='flex items-center justify-between py-1'>
            <span className='text-sm text-rh-text-secondary'>생성일</span>
            <span className='text-sm font-medium text-white'>
              {formatDate(initialData.createdAt)}
            </span>
          </div>
          <div className='flex items-center justify-between py-1'>
            <span className='text-sm text-rh-text-secondary'>현재 인원</span>
            <span className='text-sm font-medium text-white'>
              {initialData.currentMembers}명
            </span>
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          className='w-full py-3.5 rounded-xl bg-rh-accent text-white text-sm font-semibold disabled:opacity-50'
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "저장 중..." : "변경사항 저장"}
        </button>
      </div>

      {/* 로고 크롭 모달 */}
      <LogoCropModal
        open={cropOpen}
        imageSrc={cropSrc}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
      />
    </FadeIn>
  );
});

export default CrewEditForm;
