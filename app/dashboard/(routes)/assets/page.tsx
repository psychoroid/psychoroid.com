'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { useEffect, useState, useCallback } from 'react'
import { UserAssetsList } from '@/components/dashboard/UserAssetsList'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 10

export default function AssetsPage() {
    const { user } = useUser()
    const [assets, setAssets] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchUserAssets = useCallback(async () => {
        if (!user?.id) return;

        setIsLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.rpc('get_user_assets', {
                p_user_id: user.id,
                p_search: searchQuery,
                p_limit: ITEMS_PER_PAGE,
                p_offset: (currentPage - 1) * ITEMS_PER_PAGE
            })

            if (error) throw error

            // Log the first asset to check the model_path format
            if (data?.[0]) {
                console.log('First asset model path:', data[0].model_path);
            }

            setAssets(data || [])

            // Get total count
            const { count, error: countError } = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .ilike('name', `%${searchQuery}%`)

            if (countError) throw countError
            setTotalCount(count || 0)
        } catch (error: any) {
            console.error('Error fetching assets:', error)
            setError(error.message)
            toast.error('Failed to load assets')
        } finally {
            setIsLoading(false)
        }
    }, [user?.id, searchQuery, currentPage]);

    useEffect(() => {
        fetchUserAssets()
    }, [fetchUserAssets]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    return (
        <div>
            <div className="flex flex-col space-y-1 mb-8">
                <h1 className="text-xl font-semibold text-foreground">Your assets</h1>
                <p className="text-xs text-muted-foreground">
                    Manage your 3D generated assets
                </p>
            </div>

            {error ? (
                <div className="text-sm text-red-500">{error}</div>
            ) : (
                <UserAssetsList
                    assets={assets}
                    onSearch={setSearchQuery}
                    onPageChange={handlePageChange}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    isLoading={isLoading}
                />
            )}
        </div>
    )
} 