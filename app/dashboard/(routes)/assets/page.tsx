'use client'

import { useState, useEffect, useCallback } from 'react';
import { UserAssetsList } from '@/components/dashboard/UserAssetsList';
import { supabase } from '@/lib/supabase/supabase';
import { useUser } from '@/lib/contexts/UserContext';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import type { Asset } from '@/types/product';

const ITEMS_PER_PAGE = 25;

interface ProductResponse extends Omit<Asset, 'created_at' | 'updated_at'> {
    created_at: string;
    updated_at: string;
    total_count: number;
}

export default function AssetsPage() {
    const { user } = useUser();
    const { currentLanguage } = useTranslation();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);

    const fetchAssets = useCallback(async (page = 1, search = '') => {
        if (!user?.id) return;

        try {
            setIsLoading(true);
            setError(null);

            const { data, error } = await supabase.rpc('search_user_products', {
                p_user_id: user.id,
                p_search_query: search || '',
                p_page_size: ITEMS_PER_PAGE,
                p_page: page
            });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // Transform the data to match the Asset type
            const transformedData = (data || []).map((item: ProductResponse) => ({
                ...item,
                created_at: new Date(item.created_at).toISOString(),
                updated_at: new Date(item.updated_at).toISOString()
            }));

            // Always set assets, even if empty
            setAssets(transformedData);

            // Calculate total pages if we have data
            if (data && data.length > 0) {
                setTotalPages(Math.ceil(data[0].total_count / ITEMS_PER_PAGE));
            } else {
                setTotalPages(1);
            }
        } catch (error: any) {
            console.error('Error fetching assets:', error);
            setError(t(currentLanguage, 'ui.assets.errors.loadFailed'));
            setAssets([]);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, currentLanguage]);

    // Initial fetch
    useEffect(() => {
        if (user?.id) {
            fetchAssets(currentPage);
        }
    }, [fetchAssets, currentPage, user?.id]);

    const handleSearch = useCallback((query: string) => {
        setCurrentPage(1);
        fetchAssets(1, query);
    }, [fetchAssets]);

    return (
        <UserAssetsList
            assets={assets}
            isLoading={isLoading}
            onSearch={handleSearch}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onAssetUpdate={() => fetchAssets(currentPage)}
            error={error}
        />
    );
} 