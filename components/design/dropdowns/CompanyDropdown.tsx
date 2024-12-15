import { Building2, Sparkles } from 'lucide-react';

export function CompanyDropdown() {
    return (
        <div className="w-fit min-w-[320px] py-2">
            {/* Company Description */}
            <div className="px-4 -pt-6">
                <p className="text-xs text-muted-foreground">
                    psychoroid.com is an advanced artificial intelligence program that creates 3D models from text and image prompts in ~20 seconds.
                    Generated meshes are fully optimized for immediate use in game development, e-commerce, and manufacturing workflows.
                </p>
            </div>

            {/* Navigation Links
            <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Building2 className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    <span>Overview</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-[#D73D57] transition-colors">
                    <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    <span>Features</span>
                </div>
            </div> */}
        </div>
    );
} 