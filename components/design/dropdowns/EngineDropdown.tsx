import { Zap, Rocket, Lock, Globe } from 'lucide-react';

export function EngineDropdown() {
    return (
        <div className="w-fit min-w-[320px] py-2">
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Zap className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    <span>Instant high-quality 2D to 3D conversion</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Rocket className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    <span>Enterprise-grade processing power</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Globe className="h-4 w-4 text-orange-500" aria-hidden="true" />
                    <span>Multi-format export & optimization</span>
                </div>
            </div>
        </div>
    );
} 