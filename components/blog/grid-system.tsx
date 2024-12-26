export function GridSystem() {
    return (
        <div className="fixed inset-0 pointer-events-none">
            <div className="h-full w-full">
                <div className="relative h-full w-full">
                    {/* Vertical lines */}
                    <div className="absolute inset-0 grid grid-cols-12">
                        {Array.from({ length: 13 }).map((_, i) => (
                            <div key={`v-${i}`} className="relative h-full">
                                <div className="absolute right-0 top-0 h-full w-[1px] bg-[#1a1a1a]" />
                            </div>
                        ))}
                    </div>

                    {/* Horizontal lines */}
                    <div className="absolute inset-0 grid grid-rows-[repeat(8,minmax(0,1fr))]">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={`h-${i}`} className="relative w-full">
                                <div className="absolute left-0 top-0 w-full h-[1px] bg-[#1a1a1a]" />
                            </div>
                        ))}
                    </div>

                    {/* Plus symbol */}
                    <div className="absolute top-0 left-0 w-6 h-6">
                        <div className="absolute left-1/2 top-0 w-[1px] h-full bg-[#1a1a1a] -translate-x-1/2" />
                        <div className="absolute top-1/2 left-0 h-[1px] w-full bg-[#1a1a1a] -translate-y-1/2" />
                    </div>
                </div>
            </div>
        </div>
    )
}

