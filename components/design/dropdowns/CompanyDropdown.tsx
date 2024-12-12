import Link from 'next/link';

export function CompanyDropdown() {
    return (
        <div className="grid grid-cols-3 gap-8">
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Company</h3>
                <div className="flex flex-col space-y-2">
                    <Link href="/about" className="text-sm text-muted-foreground hover:text-[#D73D57] transition-colors">
                        About Us
                    </Link>
                    {/* ... other company links ... */}
                </div>
            </div>
            {/* ... other columns ... */}
        </div>
    );
} 