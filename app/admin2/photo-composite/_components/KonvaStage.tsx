"use client";

import { Stage, Layer, Image as KonvaImage } from "react-konva";
import type { LogoTransform } from "@/lib/domain/photo-composite/types";

interface Props {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap | null;
    transform: LogoTransform | null;
    /** 컨테이너 가로 폭. height는 사진 비율로 계산 */
    containerWidth: number;
    /** 자유 배치 모드일 때만 onChange 호출, 프리셋 모드는 readonly */
    onTransformChange?: (next: LogoTransform) => void;
    selectable?: boolean;
}

export default function KonvaStage({
    photoBitmap,
    logoBitmap,
    transform,
    containerWidth,
}: Props) {
    const scale = containerWidth / photoBitmap.width;
    const stageHeight = photoBitmap.height * scale;

    return (
        <Stage
            width={containerWidth}
            height={stageHeight}
            scale={{ x: scale, y: scale }}
            style={{ touchAction: "none" }}
        >
            <Layer>
                <KonvaImage
                    image={photoBitmap as unknown as CanvasImageSource}
                    width={photoBitmap.width}
                    height={photoBitmap.height}
                    listening={false}
                />
                {logoBitmap && transform && (
                    <KonvaImage
                        image={logoBitmap as unknown as CanvasImageSource}
                        x={transform.x}
                        y={transform.y}
                        width={transform.width}
                        height={
                            transform.width /
                            (logoBitmap.width / logoBitmap.height)
                        }
                        rotation={transform.rotation}
                        opacity={transform.opacity}
                        listening={false}
                    />
                )}
            </Layer>
        </Stage>
    );
}
