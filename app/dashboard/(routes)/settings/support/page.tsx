'use client'

import { Card } from '@/components/ui/card'
import SupportForm from '@/components/dashboard/SupportForm'

export default function SupportPage() {
    return (
        <div>
            <div className="flex flex-col space-y-1 mb-6">
                <h1 className="text-xl font-semibold text-foreground">Support</h1>
                <p className="text-xs text-muted-foreground">
                    Do you need assistance ?
                </p>
            </div>

            <Card className="border border-border rounded-none bg-card">
                <div className="p-4 sm:p-6">
                    <SupportForm />
                </div>
            </Card>
        </div>
    )
} 