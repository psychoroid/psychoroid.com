'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { useEffect, useState } from 'react'
import { UserAssetsList } from '@/components/dashboard/UserAssetsList'
import { supabase } from '@/lib/supabase/supabase'

const ITEMS_PER_PAGE = 10

export default function AssetsPage() {
    const { user } = useUser()
    const [assets, setAssets] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (user?.id) {
            fetchUserAssets()
        }
    }, [user?.id, searchQuery, currentPage])

    const fetchUserAssets = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase.rpc('get_user_assets', {
                p_user_id: user?.id,
                p_search: searchQuery,
                p_limit: ITEMS_PER_PAGE,
                p_offset: (currentPage - 1) * ITEMS_PER_PAGE
            })

            if (error) throw error
            setAssets(data || [])

            // Get total count
            const { count, error: countError } = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user?.id)
                .ilike('name', `%${searchQuery}%`)

            if (countError) throw countError
            setTotalCount(count || 0)
        } catch (error) {
            console.error('Error fetching assets:', error)
        } finally {
            setIsLoading(false)
        }
    }

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

            <UserAssetsList
                assets={assets}
                onSearch={setSearchQuery}
                onPageChange={handlePageChange}
                currentPage={currentPage}
                totalPages={totalPages}
                isLoading={isLoading}
            />
        </div>
    )
} 