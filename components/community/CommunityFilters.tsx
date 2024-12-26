'use client';

import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Download } from "lucide-react";
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { cn } from "@/lib/actions/utils";

export type SortFilter = 'trending' | 'new' | 'downloads';

interface CommunityFiltersProps {
    activeFilter: SortFilter;
    onFilterChange: (filter: SortFilter) => void;
}

export function CommunityFilters({ activeFilter, onFilterChange }: CommunityFiltersProps) {
    const { currentLanguage } = useTranslation();

    const filters = [
        {
            id: 'trending' as SortFilter,
            label: t(currentLanguage, 'ui.community.filters.trending'),
            icon: TrendingUp,
            color: 'text-rose-500'
        },
        {
            id: 'new' as SortFilter,
            label: t(currentLanguage, 'ui.community.filters.new'),
            icon: Clock,
            color: 'text-blue-500'
        },
        {
            id: 'downloads' as SortFilter,
            label: t(currentLanguage, 'ui.community.filters.downloads'),
            icon: Download,
            color: 'text-emerald-500'
        }
    ];

    return (
        <div className="w-full">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-end gap-2">
                    {filters.map(({ id, label, icon: Icon, color }) => (
                        <Button
                            key={id}
                            variant="ghost"
                            onClick={() => onFilterChange(id)}
                            className={cn(
                                "h-9 w-9 p-0 rounded-none relative transition-all hover:bg-accent",
                                activeFilter === id && "bg-accent text-accent-foreground",
                                activeFilter === id && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary"
                            )}
                            title={label}
                        >
                            <Icon className={cn("w-4 h-4", color)} />
                            <span className="sr-only">{label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
} 