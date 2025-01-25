'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Button } from '@/components/ui/button';
import { Undo, RotateCcw } from 'lucide-react';

interface Parameter {
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
}

interface CADParametersProps {
    parameters: Parameter[];
    onChange: (name: string, value: number) => void;
    onReset: () => void;
    onUndo: () => void;
    className?: string;
}

const formatValue = (value: number, unit?: string) => {
    return `${value.toFixed(1)}${unit ? unit : ''}`;
};

function PureCADParameters({ parameters, onChange, onReset, onUndo, className }: CADParametersProps) {
    return (
        <div className={className}>
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-sm font-semibold">Parameters</h2>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onUndo}
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onReset}
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-10rem)]">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6 p-4"
                >
                    {parameters.map((param) => (
                        <div key={param.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs capitalize">
                                    {param.name.replace(/([A-Z])/g, ' $1').trim()}
                                </Label>
                                <Input
                                    type="number"
                                    value={param.value}
                                    onChange={(e) => onChange(param.name, parseFloat(e.target.value))}
                                    className="w-20 h-7 text-xs"
                                    min={param.min}
                                    max={param.max}
                                    step={param.step}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[param.value]}
                                    min={param.min}
                                    max={param.max}
                                    step={param.step}
                                    onValueChange={([value]) => onChange(param.name, value)}
                                    className="flex-1"
                                />
                                <span className="text-xs text-muted-foreground w-12 text-right">
                                    {formatValue(param.value, param.unit)}
                                </span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </ScrollArea>
        </div>
    );
}

export const CADParameters = memo(PureCADParameters); 