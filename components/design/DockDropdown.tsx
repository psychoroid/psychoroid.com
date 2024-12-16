import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface DockDropdownProps {
    isOpen: boolean;
    children: ReactNode;
}

export function DockDropdown({ isOpen, children }: DockDropdownProps) {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block border-t border-border mt-1 -ml-2 -mr-4"
        >
            <div className="py-6 px-2 md:px-4">
                {children}
            </div>
        </motion.div>
    );
} 