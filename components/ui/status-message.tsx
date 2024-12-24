'use client'

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/actions/utils"

interface StatusMessageProps {
    children: React.ReactNode
    className?: string
}

export function StatusMessage({ children, className }: StatusMessageProps) {
    return (
        <div className={cn(
            "px-4 py-2 text-center",
            className
        )}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={children?.toString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-muted-foreground"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    )
} 