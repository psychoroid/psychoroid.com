import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
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
import { useEffect, useRef, useState } from 'react';

// Persistent Globe component that stays mounted
function PersistentGlobe({ isVisible }: { isVisible: boolean }) {
    return (
        <div
            className="w-[350px] h-[350px] select-none pointer-events-none transition-opacity duration-300"
            style={{
                opacity: isVisible ? 1 : 0,
                position: 'absolute',
                right: '-550px',
                top: '-65px',
                transform: 'scale(0.8)'
            }}
        >
            <Globe
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
    );
}

export function ResourcesDropdown() {
    const { currentLanguage } = useTranslation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    setIsVisible(entry.isIntersecting);
                });
            },
            { threshold: 0.1 }
        );

        if (dropdownRef.current) {
            observer.observe(dropdownRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={dropdownRef} className="w-fit min-w-[220px] py-2 relative">
            <div className="flex items-start">
                <div className="flex flex-col space-y-2">
                    <Link
                        href="https://github.com/psychoroid"
                        className="text-xs text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <Github className="h-4 w-4 text-foreground" />
                        {t(currentLanguage, 'dropdowns.resources.open_source')}
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/docs"
                        className="text-xs text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <FileText className="h-4 w-4 text-[#D73D57]" />
                        {t(currentLanguage, 'dropdowns.resources.documentation')}
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/engine"
                        className="text-xs text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <Cpu className="h-4 w-4 text-purple-500" />
                        {t(currentLanguage, 'dropdowns.resources.engine')}
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/community"
                        className="text-xs text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <Users className="h-4 w-4 text-cyan-500" />
                        {t(currentLanguage, 'dropdowns.resources.join_community')}
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/integrations"
                        className="text-xs text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <AppWindow className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        {t(currentLanguage, 'dropdowns.resources.integrations')}
                    </Link>
                    <Link
                        href="https://developers.psychoroid.com/components"
                        className="text-xs text-muted-foreground hover:text-[#D73D57] transition-colors flex items-center gap-2 px-4 py-1.5"
                    >
                        <Boxes className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                        {t(currentLanguage, 'dropdowns.resources.boilerplates')}
                    </Link>
                </div>
                <PersistentGlobe isVisible={isVisible} />
            </div>
        </div>
    );
} 