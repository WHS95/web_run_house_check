/**
 * 마지막 콘텐츠가 sticky 헤더 바로 아래까지만
 * 스크롤될 수 있도록 하단 여백 확보.
 *
 * height = 100dvh
 *          - var(--rh-bottom-inset)  (바텀 내비)
 *          - stickyArea              (헤더+셀렉터)
 *          - lastCard                (마지막 카드)
 *
 * @param stickyArea  sticky 영역 총 높이 (px)
 * @param lastCard    마지막 카드 예상 높이 (px)
 */
export default function BottomSpacer({
    stickyArea = 100,
    lastCard = 210,
}: {
    stickyArea?: number;
    lastCard?: number;
}) {
    const fixed = stickyArea + lastCard;
    return (
        <div
            style={{
                height:
                    `calc(100dvh`
                    + ` - var(--rh-bottom-inset, 0px)`
                    + ` - ${fixed}px)`,
            }}
            aria-hidden
        />
    );
}
