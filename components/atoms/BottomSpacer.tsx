/**
 * 마지막 콘텐츠가 sticky 헤더까지
 * 스크롤될 수 있도록 하단 여백 확보.
 *
 * height = 100dvh - stickyAreaPx - lastCardPx
 *
 * @param stickyArea  헤더+셀렉터 등 sticky 영역 높이 (px)
 * @param lastCard    마지막 카드 예상 높이 (px)
 */
export default function BottomSpacer({
    stickyArea = 100,
    lastCard = 210,
}: {
    stickyArea?: number;
    lastCard?: number;
}) {
    const total = stickyArea + lastCard;
    return (
        <div
            className={
                `h-[calc(100dvh-${total}px)]`
            }
            aria-hidden
        />
    );
}
