import Link from 'next/link';
import {
    FileText,
    Cpu,
    Github,
    Boxes,
    Users,
    AppWindow
} from 'lucide-react';
import Globe, { GLOBE_CONFIG } from '@/components/ui/magic/globe';

export function ResourcesDropdown() {
    return (
        <div className="w-fit min-w-[220px] py-2 relative">
            <div className="flex items-start">
                <div className="flex flex-col space-y-2">
                    <Link
                        href="https://github.com/psychoroid"
                        className="text-sm text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <Github className="h-4 w-4 text-gray-500" />
                        Open Source
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/docs"
                        className="text-sm text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <FileText className="h-4 w-4 text-blue-500" />
                        Documentation
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/engine"
                        className="text-sm text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <Cpu className="h-4 w-4 text-emerald-500" />
                        Engine
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/community"
                        className="text-sm text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <Users className="h-4 w-4 text-purple-500" />
                        Join the community
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/integrations"
                        className="text-sm text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <AppWindow className="h-4 w-4 text-orange-500" />
                        Apps & Integrations
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/components"
                        className="text-sm text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <Boxes className="h-4 w-4 text-pink-500" />
                        Components
                    </Link>
                </div>

                <div className="absolute -right-[550px] -top-[85px] w-[415px] h-[415px] select-none pointer-events-none">
                    <Globe
                        className="scale-[0.8] opacity-84"
                        config={{
                            ...GLOBE_CONFIG,
                            width: 400,
                            height: 400,
                            phi: 0.8,
                            theta: 1.1,
                            dark: 2,
                            diffuse: 0.9,
                            mapBrightness: 6,
                            baseColor: [0.3, 0.3, 0.3],
                            markerColor: [0.91, 0.20, 0.34],
                            glowColor: [0.91, 0.20, 0.34],
                        }}
                    />
                </div>
            </div>
        </div>
    );
} 