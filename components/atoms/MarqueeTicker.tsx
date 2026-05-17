'use client';

import React, { memo } from 'react';

interface MarqueeTickerProps {
    text: string;
    separator?: string;
    repeatCount?: number;
}

const MarqueeTicker = memo<MarqueeTickerProps>(({
    text,
    separator = '–',
    repeatCount = 8,
}) => {
    const items = Array.from({ length: repeatCount }, (_, i) => (
        <span key={i} className="inline-flex items-center shrink-0">
            <span className="uppercase font-black tracking-widest text-[13px] text-white">
                {text}
            </span>
            <span className="mx-4 text-[13px] font-black text-white">
                {separator}
            </span>
        </span>
    ));

    return (
        <div className="overflow-hidden w-full">
            <div className="rh-marquee flex whitespace-nowrap">
                <div className="rh-marquee-inner flex shrink-0">
                    {items}
                </div>
                {/* 두 번째 복사본으로 끊김 없는 루프 */}
                <div className="rh-marquee-inner flex shrink-0" aria-hidden>
                    {items}
                </div>
            </div>
        </div>
    );
});

MarqueeTicker.displayName = 'MarqueeTicker';

export default MarqueeTicker;
