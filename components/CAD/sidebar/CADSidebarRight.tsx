'use client';

import { memo, useCallback, useRef, useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Undo, RotateCcw, Lock, Unlock } from 'lucide-react';
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/actions/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HexColorPicker } from "react-colorful";
import { Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';

// Types
interface BaseParameter {
    name: string;
    min: number;
    max: number;
    step: number;
    unit?: string;
    locked?: boolean;
    group?: string;
}

interface NumberParameter extends BaseParameter {
    type: 'number';
    value: number;
}

interface ColorParameter extends BaseParameter {
    type: 'color';
    value: string;
}

type Parameter = NumberParameter | ColorParameter;

interface CADParametersProps {
    parameters: Parameter[];
    onChange: (name: string, value: number | string) => void;
    onReset: () => void;
    onUndo: () => void;
    className?: string;
}

interface ClampedParameters {
    width: number;
    height: number;
    depth: number;
    radius: number;
    segments: number;
    rotation: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    material: {
        color: string;
        roughness: number;
        metalness: number;
        opacity: number;
        wireframe: boolean;
    };
}

// Parameter Input Component
const ParameterInput = memo(({ param, onChange }: { param: Parameter; onChange: (name: string, value: number | string) => void }) => {
    const debounceTimer = useRef<NodeJS.Timeout>();

    const debouncedOnChange = useCallback((name: string, value: number | string) => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            onChange(name, value);
        }, 16); // Sync with frame rate for smooth updates
    }, [onChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!param.locked && param.type === 'number') {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                debouncedOnChange(param.name, value);
            }
        }
    }, [param, debouncedOnChange]);

    const handleSliderChange = useCallback(([value]: number[]) => {
        if (!param.locked && param.type === 'number') {
            debouncedOnChange(param.name, value);
        }
    }, [param, debouncedOnChange]);

    const formatTooltip = useCallback((value: number) => {
        if (param.step < 1) {
            return value.toFixed(2);
        }
        return value.toFixed(1);
    }, [param.step]);

    const handleLockToggle = useCallback(() => {
        param.locked = !param.locked;
    }, [param]);

    if (param.type === 'color') {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground capitalize">
                    {param.name.replace(/([A-Z])/g, ' $1').trim()}
                    {param.unit && <span className="ml-1 text-muted-foreground/70">({param.unit})</span>}
                </Label>
                <Input
                    type="number"
                    value={param.value}
                    onChange={handleInputChange}
                    className="h-6 w-14 rounded-none text-xs bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent border-0 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    disabled={param.locked}
                />
            </div>
            <Slider
                value={[param.value]}
                min={param.min}
                max={param.max}
                step={param.step / 10}
                onValueChange={handleSliderChange}
                disabled={param.locked}
                formatTooltip={formatTooltip}
                className="py-2"
            />
        </div>
    );
});

ParameterInput.displayName = "ParameterInput";

// Dimensions Section Component
const DimensionsSection = memo(({ parameters, onChange }: { parameters: Parameter[], onChange: (name: string, value: number | string) => void }) => (
    <ParameterGroup title="Dimensions">
        {parameters.map((param) => (
            <ParameterInput
                key={param.name}
                param={param}
                onChange={onChange}
            />
        ))}
    </ParameterGroup>
));

DimensionsSection.displayName = "DimensionsSection";

// Material Section Component
const MaterialSection = memo(({ parameters, onChange }: { parameters: Parameter[], onChange: (name: string, value: number | string) => void }) => {
    // Initialize with our default red if no color parameter exists
    const defaultColorParam: ColorParameter = {
        type: 'color',
        name: 'color',
        value: '#D73D57',
        min: 0,
        max: 0,
        step: 0
    };

    const colorParam = parameters.find(p => p.type === 'color' && p.name === 'color') as ColorParameter || defaultColorParam;
    const otherParams = parameters.filter(p => p.type === 'number');

    // Set default color on mount if not already set
    useEffect(() => {
        if (!parameters.find(p => p.type === 'color' && p.name === 'color')) {
            onChange('color', '#D73D57');
        }
    }, [parameters, onChange]);

    const handleColorChange = useCallback((newColor: string) => {
        onChange('color', newColor);
    }, [onChange]);

    return (
        <ParameterGroup title="Material">
            <div className="space-y-2 mb-4 mx-2">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="w-full aspect-square rounded-none overflow-hidden border border-border/50 [&_.react-colorful__pointer]:!h-1 [&_.react-colorful__pointer]:!w-1">
                    <HexColorPicker
                        color={'#D73D57'}
                        onChange={handleColorChange}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            </div>
            {otherParams.map((param) => (
                <ParameterInput
                    key={param.name}
                    param={param}
                    onChange={onChange}
                />
            ))}
        </ParameterGroup>
    );
});

MaterialSection.displayName = "MaterialSection";

// Parameter Group Component
const ParameterGroup = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
            <h3 className="text-xs font-medium text-muted-foreground capitalize">{title}</h3>
            <Separator className="flex-1" />
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
));

ParameterGroup.displayName = "ParameterGroup";

// Main Component
const CADParameters = memo(({ parameters, onChange, onReset, onUndo, className }: CADParametersProps) => {
    const meshRef = useRef<Mesh<BoxGeometry | RoundedBoxGeometry, MeshStandardMaterial>>(null);

    const groupedParameters = useMemo(() => {
        const groups: Record<string, Parameter[]> = {};
        parameters.forEach(param => {
            const group = param.group || 'other';
            if (!groups[group]) groups[group] = [];
            groups[group].push(param);
        });
        return groups;
    }, [parameters]);

    // Helper function to find parameter value
    const getParamValue = useCallback((name: string): number | string | null => {
        const param = parameters.find(p => p.name === name);
        return param ? param.value : null;
    }, [parameters]);

    // Update mesh when parameters change
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        // Clamp parameters between 0.1 and 100
        const clampedParams: ClampedParameters = {
            width: Math.min(100, Math.max(0.1, Number(getParamValue('width')) ?? 1)),
            height: Math.min(100, Math.max(0.1, Number(getParamValue('height')) ?? 1)),
            depth: Math.min(100, Math.max(0.1, Number(getParamValue('depth')) ?? 1)),
            radius: Math.min(
                Math.min(
                    Number(getParamValue('width')) ?? 1,
                    Math.min(Number(getParamValue('height')) ?? 1, Number(getParamValue('depth')) ?? 1)
                ) / 2,
                Math.max(0, Number(getParamValue('radius')) ?? 0)
            ),
            segments: Math.min(64, Math.max(4, Math.floor(Number(getParamValue('segments')) ?? 32))),
            rotation: {
                x: Number(getParamValue('rotationX')) ?? 0,
                y: Number(getParamValue('rotationY')) ?? 0,
                z: Number(getParamValue('rotationZ')) ?? 0
            },
            position: {
                x: Number(getParamValue('positionX')) ?? 0,
                y: Number(getParamValue('positionY')) ?? 0,
                z: Number(getParamValue('positionZ')) ?? 0
            },
            scale: {
                x: Number(getParamValue('scaleX')) ?? 1,
                y: Number(getParamValue('scaleY')) ?? 1,
                z: Number(getParamValue('scaleZ')) ?? 1
            },
            material: {
                color: String(getParamValue('color') ?? '#ffffff'),
                roughness: Math.min(1, Math.max(0, Number(getParamValue('roughness')) ?? 0.5)),
                metalness: Math.min(1, Math.max(0, Number(getParamValue('metalness')) ?? 0)),
                opacity: Math.min(1, Math.max(0, Number(getParamValue('opacity')) ?? 1)),
                wireframe: Boolean(getParamValue('wireframe') ?? false)
            }
        };

        // For the default cube
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }

        // Use RoundedBoxGeometry when radius > 0, otherwise use regular BoxGeometry
        if (clampedParams.radius > 0) {
            const minDimension = Math.min(
                clampedParams.width,
                Math.min(clampedParams.height, clampedParams.depth)
            );
            // Calculate radius as a percentage of the smallest dimension
            const effectiveRadius = clampedParams.radius;

            // Use more segments for smoother rounding
            const segments = Math.max(1, Math.floor(clampedParams.segments * (effectiveRadius / minDimension)));

            mesh.geometry = new RoundedBoxGeometry(
                clampedParams.width,
                clampedParams.height,
                clampedParams.depth,
                segments,
                effectiveRadius
            );
        } else {
            mesh.geometry = new BoxGeometry(
                clampedParams.width,
                clampedParams.height,
                clampedParams.depth,
                clampedParams.segments,
                clampedParams.segments,
                clampedParams.segments
            );
        }

        // Update material
        if (mesh.material) {
            mesh.material.color.set(clampedParams.material.color);
            mesh.material.roughness = clampedParams.material.roughness;
            mesh.material.metalness = clampedParams.material.metalness;
            mesh.material.opacity = clampedParams.material.opacity;
            mesh.material.transparent = clampedParams.material.opacity < 1;
            mesh.material.wireframe = clampedParams.material.wireframe;
        }

        // Update transform
        mesh.rotation.set(
            clampedParams.rotation.x * Math.PI / 180,
            clampedParams.rotation.y * Math.PI / 180,
            clampedParams.rotation.z * Math.PI / 180
        );
        mesh.position.set(
            clampedParams.position.x,
            clampedParams.position.y,
            clampedParams.position.z
        );
    }, [parameters, getParamValue, meshRef]);

    return (
        <div className={cn("relative h-full flex", className)}>
            <Sidebar className="border-l w-[290px] transition-[width] duration-300 ease-in-out">
                <header className="flex h-[3.5rem] shrink-0 items-center gap-2 border-b border-border/50">
                    <div className="flex items-center gap-2 px-4 w-full">
                        <div className="ml-auto flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onUndo}
                                className="w-8 h-8 rounded-none flex items-center justify-center"
                                title="Undo last change"
                            >
                                <Undo className="h-4 w-4" />
                            </Button>
                            <Separator
                                orientation="vertical"
                                className="h-8 cursor-pointer hover:bg-accent/50 transition-colors"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onReset}
                                className="h-8 w-8 rounded-none"
                                title="Reset parameters"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </header>
                <SidebarContent className="p-0">
                    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-hide">
                        <div className="space-y-6 p-4">
                            {/* Dimensions Section */}
                            {groupedParameters.dimensions && (
                                <DimensionsSection
                                    parameters={groupedParameters.dimensions}
                                    onChange={onChange}
                                />
                            )}

                            {/* Material Section */}
                            {groupedParameters.material && (
                                <MaterialSection
                                    parameters={groupedParameters.material}
                                    onChange={onChange}
                                />
                            )}
                        </div>
                    </div>
                </SidebarContent>
            </Sidebar>
        </div>
    );
});

CADParameters.displayName = "CADParameters";

export default CADParameters; 