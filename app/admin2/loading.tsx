export default function Admin2Loading() {
    return (
        <div className="flex-1 px-4 pt-4 space-y-5">
            <div className="shrink-0 bg-rh-bg-surface h-14" />
            <div className="h-10 flex items-center justify-center">
                <div className="w-32 h-5 bg-rh-bg-muted rounded" />
            </div>
            <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex-1 h-[90px] bg-rh-bg-surface rounded-[12px]"
                    />
                ))}
            </div>
            <div className="w-16 h-3 bg-rh-bg-muted rounded" />
            <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-14 bg-rh-bg-surface rounded-[12px]"
                    />
                ))}
            </div>
        </div>
    );
}
