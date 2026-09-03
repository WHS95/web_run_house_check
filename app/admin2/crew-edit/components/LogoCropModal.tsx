"use client";

import { memo, useCallback, useState } from "react";
import nextDynamic from "next/dynamic";
import type { Area } from "react-easy-crop";
// 크롭 UI 는 로고 편집 시에만 필요하다.
// next/dynamic 은 제네릭·기본 props 타입을 잃으므로 원본 타입으로 복원한다.
const Cropper = nextDynamic(() => import("react-easy-crop"), {
    ssr: false,
    loading: () => <div className='h-full w-full bg-rh-bg-inset' />,
}) as typeof import("react-easy-crop").default;
import AdminModal from "@/app/admin2/components/ui/AdminModal";

interface LogoCropModalProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (croppedBlob: Blob) => void;
}

/**
 * 이미지 URL을 HTMLImageElement로 로드
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.crossOrigin = "anonymous";
    image.src = url;
  });

/**
 * 원본 이미지에서 지정된 crop 영역만 canvas로 추출하여 Blob 반환
 * 원형 마스크는 실제 앱에서 border-radius로 표현하므로
 * 여기서는 사각형 crop(원형의 외접 정사각형)을 추출한다.
 */
const getCroppedBlob = async (
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context not available");

  // 출력 해상도는 최대 512로 제한 (로고 용도)
  const outSize = Math.min(512, pixelCrop.width);
  canvas.width = outSize;
  canvas.height = outSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outSize,
    outSize,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("blob 변환 실패"));
          return;
        }
        resolve(blob);
      },
      "image/png",
      0.92,
    );
  });
};

const LogoCropModal = memo(function LogoCropModal({
  open,
  imageSrc,
  onClose,
  onConfirm,
}: LogoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setProcessing(true);
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      alert("이미지 처리에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, onConfirm]);

  const handleClose = useCallback(() => {
    // 상태 초기화
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  }, [onClose]);

  return (
    <AdminModal
      open={open}
      onClose={handleClose}
      title='로고 이미지 자르기'
      footer={
        <div className='flex gap-2'>
          <button
            className='flex-1 py-3 rounded-xl bg-rh-bg-muted text-white text-sm font-semibold disabled:opacity-50'
            onClick={handleClose}
            disabled={processing}
          >
            취소
          </button>
          <button
            className='flex-1 py-3 rounded-xl bg-rh-accent text-white text-sm font-semibold disabled:opacity-50'
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
          >
            {processing ? "처리 중..." : "적용"}
          </button>
        </div>
      }
    >
      <div className='flex flex-col gap-4'>
        {/* Cropper 영역 */}
        <div className='relative w-full h-[260px] rounded-xl overflow-hidden bg-rh-bg-inset'>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape='round'
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        {/* 줌 슬라이더 */}
        <div className='flex items-center gap-3'>
          <span className='text-xs text-rh-text-secondary w-8'>줌</span>
          <input
            type='range'
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className='flex-1 accent-rh-accent'
          />
        </div>
        <p className='text-xs text-rh-text-tertiary'>
          드래그하여 위치 조절, 슬라이더로 확대/축소하세요.
        </p>
      </div>
    </AdminModal>
  );
});

export default LogoCropModal;
