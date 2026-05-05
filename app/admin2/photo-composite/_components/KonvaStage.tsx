"use client";

import { useEffect, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import type Konva from "konva";
import { 클램프적용하기 } from "@/lib/domain/photo-composite/transforms";
import type { LogoTransform } from "@/lib/domain/photo-composite/types";

interface Props {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap | null;
    transform: LogoTransform | null;
    containerWidth: number;
    onTransformChange?: (next: LogoTransform) => void;
    selectable?: boolean;
}

export default function KonvaStage({
    photoBitmap,
    logoBitmap,
    transform,
    containerWidth,
    onTransformChange,
    selectable = false,
}: Props) {
    const scale = containerWidth / photoBitmap.width;
    const stageHeight = photoBitmap.height * scale;
    const logoRef = useRef<Konva.Image>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (selectable && logoRef.current && trRef.current) {
            trRef.current.nodes([logoRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [selectable, logoBitmap]);

    if (!logoBitmap || !transform) {
        return (
            <Stage
                width={containerWidth}
                height={stageHeight}
                scale={{ x: scale, y: scale }}
            >
                <Layer>
                    <KonvaImage
                        image={photoBitmap as unknown as CanvasImageSource}
                        width={photoBitmap.width}
                        height={photoBitmap.height}
                        listening={false}
                    />
                </Layer>
            </Stage>
        );
    }

    const aspectRatio = logoBitmap.width / logoBitmap.height;
    const photoBounds = {
        width: photoBitmap.width,
        height: photoBitmap.height,
    };

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
                <KonvaImage
                    ref={logoRef}
                    image={logoBitmap as unknown as CanvasImageSource}
                    x={transform.x}
                    y={transform.y}
                    width={transform.width}
                    height={transform.width / aspectRatio}
                    rotation={transform.rotation}
                    opacity={transform.opacity}
                    draggable={selectable}
                    listening={selectable}
                    onDragEnd={(e) => {
                        if (!onTransformChange) return;
                        const next = 클램프적용하기(
                            {
                                ...transform,
                                x: e.target.x(),
                                y: e.target.y(),
                            },
                            photoBounds,
                            aspectRatio,
                        );
                        onTransformChange(next);
                    }}
                    onTransformEnd={(e) => {
                        if (!onTransformChange) return;
                        const node = e.target as Konva.Image;
                        const scaleX = node.scaleX();
                        const newWidth = transform.width * scaleX;
                        node.scaleX(1);
                        node.scaleY(1);
                        const next = 클램프적용하기(
                            {
                                x: node.x(),
                                y: node.y(),
                                width: newWidth,
                                rotation: node.rotation(),
                                opacity: transform.opacity,
                            },
                            photoBounds,
                            aspectRatio,
                        );
                        onTransformChange(next);
                    }}
                />
                {selectable && (
                    <Transformer
                        ref={trRef}
                        keepRatio
                        enabledAnchors={[
                            "top-left",
                            "top-right",
                            "bottom-left",
                            "bottom-right",
                        ]}
                        rotateEnabled
                        boundBoxFunc={(oldBox, newBox) => {
                            // 최소 32px 보장
                            if (newBox.width < 32) return oldBox;
                            return newBox;
                        }}
                    />
                )}
            </Layer>
        </Stage>
    );
}
