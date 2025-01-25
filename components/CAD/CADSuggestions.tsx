'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Box,
    Cylinder as CylinderIcon,
    CircleDot,
    BoxSelect,
    Layers
} from 'lucide-react';

interface CADSuggestion {
    icon: React.ReactNode;
    title: string;
    prompt: string;
}

const suggestions: CADSuggestion[] = [
    {
        icon: <Box className="h-4 w-4" />,
        title: 'Create a Box',
        prompt: 'Create a box with dimensions 100x100x100 units'
    },
    {
        icon: <CylinderIcon className="h-4 w-4" />,
        title: 'Create a Cylinder',
        prompt: 'Create a cylinder with radius 50 and height 200 units'
    },
    {
        icon: <CircleDot className="h-4 w-4" />,
        title: 'Create a Sphere',
        prompt: 'Create a sphere with radius 75 units'
    },
    {
        icon: <BoxSelect className="h-4 w-4" />,
        title: 'Create a Complex Shape',
        prompt: 'Create a shape with multiple features including holes and fillets'
    },
    {
        icon: <Layers className="h-4 w-4" />,
        title: 'Create an Assembly',
        prompt: 'Create an assembly with multiple parts that fit together'
    }
];

interface CADSuggestionsProps {
    onSuggestionClick: (prompt: string) => void;
    isLoading?: boolean;
}

function PureCADSuggestions({ onSuggestionClick, isLoading }: CADSuggestionsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 p-4"
        >
            {suggestions.map((suggestion) => (
                <Button
                    key={suggestion.title}
                    variant="outline"
                    className="h-auto py-2 px-3 flex items-center gap-2 text-sm"
                    onClick={() => onSuggestionClick(suggestion.prompt)}
                    disabled={isLoading}
                >
                    {suggestion.icon}
                    <span>{suggestion.title}</span>
                </Button>
            ))}
        </motion.div>
    );
}

export const CADSuggestions = memo(PureCADSuggestions); 