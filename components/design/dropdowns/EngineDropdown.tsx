import Link from 'next/link';

export function EngineDropdown() {
    return (
        <div className="grid grid-cols-3 gap-8">
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Features</h3>
                <div className="flex flex-col space-y-2">
                    <Link href="/features/conversion" className="text-sm text-muted-foreground hover:text-[#D73D57] transition-colors">
                        2D to 3D Conversion
                    </Link>
                    {/* ... other engine-related links ... */}
                </div>
            </div>
            {/* ... other columns ... */}
        </div>
    );
} 