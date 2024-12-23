'use client'

import { Input } from "@/components/ui/input"
import { Folder, Grid, Menu, Box } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AssetLibraryProps {
    searchQuery: string
    onSearchChange: (value: string) => void
    assetGroups: {
        id: string
        title: string
        assets: string[]
    }[]
}

export function AssetLibrary({ searchQuery, onSearchChange, assetGroups }: AssetLibraryProps) {
    return (
        <div className="w-80 flex flex-col">
            <div className="flex-1 border border-border bg-card/50 flex flex-col h-[calc(100vh-14rem)]">
                <div className="p-2 border-b border-border">
                    <Input
                        placeholder="Search my generation"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-background/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
                <div className="flex border-b border-border">
                    <Button variant="ghost" size="icon" className="w-10 h-10">
                        <Folder className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10">
                        <Grid className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10">
                        <Menu className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10">
                        <Box className="w-5 h-5" />
                    </Button>
                </div>
                <div className="flex-1 p-2 overflow-auto">
                    {assetGroups.map((group) => (
                        <div key={group.id} className="space-y-1 mb-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium">{group.title}</h3>
                                <span className="text-xs text-muted-foreground">
                                    All {group.assets.length} assets
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                {group.assets.slice(0, 4).map((asset, index) => (
                                    <div
                                        key={index}
                                        className="aspect-square bg-background/50 border border-border"
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
} 