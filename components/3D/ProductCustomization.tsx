import { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Globe, Lock, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabase';
import { toast } from 'sonner';
import type { CommunityProduct } from '@/types/community';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/actions/utils";
import { getTagColor } from '@/lib/utils/tagColors';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';
import { Skeleton } from "@/components/ui/skeleton";

interface ProductCustomizationProps {
    product: CommunityProduct;
}

export function ProductCustomization({ product }: ProductCustomizationProps) {
    const [name, setName] = useState(product.name);
    const [description, setDescription] = useState(product.description || '');
    const [tags, setTags] = useState<string[]>(product.tags || []);
    const [visibility, setVisibility] = useState(product.visibility);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTag, setEditingTag] = useState<number | null>(null);
    const [newTagInput, setNewTagInput] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [showTagInput, setShowTagInput] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const debouncedSave = useMemo(
        () => debounce(async (updates: { name?: string; description?: string; tags?: string[] }) => {
            if (!product.id || product.id === 'temp-id') return;

            try {
                const { error } = await supabase.rpc('update_product_content', {
                    p_product_id: product.id,
                    p_name: updates.name || name,
                    p_description: updates.description || description || null,
                    p_tags: updates.tags || tags || []
                });

                if (error) throw error;
            } catch (error) {
                console.error('Error updating product:', error);
                toast.error('Failed to save changes');
            }
        }, 1000),
        [product.id, name, description, tags]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            debouncedSave.cancel();
        };
    }, [debouncedSave]);

    // Fetch product details only once on mount
    useEffect(() => {
        const fetchProductDetails = async () => {
            if (product.id === 'temp-id') {
                setIsLoading(false);
                setName(product.name);
                setDescription(product.description || '');
                setTags(product.tags || []);
                setVisibility(product.visibility);
                return;
            }

            try {
                setIsLoading(true);
                const { data, error } = await supabase.rpc('get_product_by_id', {
                    p_product_id: product.id
                });

                if (error) throw error;

                if (data && data.length > 0) {
                    const productDetails = data[0];
                    setName(productDetails.name);
                    setDescription(productDetails.description || '');
                    setTags(productDetails.tags || []);
                    setVisibility(productDetails.visibility);
                }
            } catch (error) {
                console.error('Error fetching product details:', error);
                toast.error('Failed to load product details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductDetails();
    }, [product.id, product.name, product.description, product.tags, product.visibility]);

    const handleVisibilityToggle = async () => {
        try {
            const isDefaultAsset = product.model_path.startsWith('default-assets/');
            if (isDefaultAsset) {
                toast.error('Cannot change visibility of default assets');
                return;
            }

            const newVisibility = visibility === 'public' ? 'private' : 'public';

            const { data, error } = await supabase.rpc('toggle_model_visibility', {
                p_product_id: product.id,
                p_visibility: newVisibility
            });

            if (error) throw error;
            if (data === false) throw new Error('Unauthorized to change visibility');

            setVisibility(newVisibility);
            toast.success(`Visibility changed to ${newVisibility}`);
        } catch (error: any) {
            console.error('Error toggling visibility:', error);
            toast.error(error.message || 'Failed to change visibility');
        }
    };

    const handleNameSubmit = async () => {
        if (!name.trim()) return;
        setIsEditingName(false);
        debouncedSave({ name: name.trim() });
    };

    const handleDescriptionSubmit = async () => {
        setIsEditingDescription(false);
        debouncedSave({ description: description?.trim() || '' });
    };

    const handleTagEdit = async (index: number, newValue: string) => {
        if (!newValue.trim()) {
            // If tag is empty, remove it
            const newTags = tags.filter((_, i) => i !== index);
            setTags(newTags);
            setEditingTag(null);
            debouncedSave({ tags: newTags });
            return;
        }

        const newTags = [...tags];
        newTags[index] = newValue.trim();
        setTags(newTags);
        setEditingTag(null);
        debouncedSave({ tags: newTags });
    };

    const handleAddTag = async () => {
        if (newTagInput.trim()) {
            const newTags = [...tags, newTagInput.trim()];
            setTags(newTags);
            setNewTagInput('');
            setShowTagInput(false);
            debouncedSave({ tags: newTags });
        } else {
            setShowTagInput(false);
            setNewTagInput('');
        }
    };

    // Return nothing if it's a temporary product
    if (product.id === 'temp-id') {
        return null;
    }

    if (isLoading) {
        return (
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-64" />
                <div className="flex items-center gap-1">
                    <Skeleton className="h-[22px] w-16" />
                    <Skeleton className="h-[22px] w-16" />
                    <Skeleton className="h-[22px] w-16" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-[19px] flex flex-col gap-2"
        >
            {/* Name and Visibility */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="flex items-center gap-2"
            >
                {(isEditingName || name) && (
                    isEditingName ? (
                        <Input
                            ref={inputRef}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                            className="h-6 min-w-0 w-auto max-w-[200px] text-sm font-medium rounded-none px-1 py-0 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-accent/10"
                            autoFocus
                        />
                    ) : (
                        <span
                            className="text-sm text-foreground cursor-pointer hover:text-accent"
                            onClick={() => setIsEditingName(true)}
                        >
                            {name}
                        </span>
                    )
                )}
                <span className="text-muted-foreground">|</span>
                <Badge
                    variant={visibility === 'public' ? 'default' : 'secondary'}
                    className={cn(
                        `cursor-pointer hover:opacity-80 transition-opacity rounded-[4px]`,
                        visibility === 'public'
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
                        product.model_path.startsWith('default-assets/') && 'cursor-not-allowed opacity-50 pointer-events-none'
                    )}
                    onClick={handleVisibilityToggle}
                >
                    {visibility}
                </Badge>
            </motion.div>

            {/* Description */}
            {(isEditingDescription || description) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.2 }}
                    className="w-full max-w-[700px]"
                >
                    {isEditingDescription ? (
                        <Input
                            ref={textareaRef as any}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescriptionSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleDescriptionSubmit()}
                            className="h-5 w-full min-w-[700px] text-xs rounded-none px-1 py-0 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-accent/10"
                            autoFocus
                        />
                    ) : (
                        <span
                            className="text-xs text-muted-foreground cursor-pointer hover:text-accent"
                            onClick={() => setIsEditingDescription(true)}
                        >
                            {description}
                        </span>
                    )}
                </motion.div>
            )}

            {/* Tags */}
            {(tags.length > 0 || showTagInput) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                    className="flex items-center gap-1 flex-wrap"
                >
                    {tags.map((tag, index) => (
                        editingTag === index ? (
                            <Input
                                key={index}
                                value={tag}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const newTags = [...tags];
                                    newTags[index] = e.target.value;
                                    setTags(newTags);
                                }}
                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                    const value = e.target.value;
                                    if (!value.trim()) {
                                        // Remove empty tags on blur
                                        const newTags = tags.filter((_, i) => i !== index);
                                        setTags(newTags);
                                        setEditingTag(null);
                                        debouncedSave({ tags: newTags });
                                    } else {
                                        handleTagEdit(index, value);
                                    }
                                }}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                        handleTagEdit(index, e.currentTarget.value);
                                    }
                                    if (e.key === 'Escape') {
                                        setEditingTag(null);
                                    }
                                    if (e.key === 'Backspace' && !e.currentTarget.value) {
                                        const newTags = tags.filter((_, i) => i !== index);
                                        setTags(newTags);
                                        setEditingTag(null);
                                        debouncedSave({ tags: newTags });
                                    }
                                }}
                                className="h-[22px] min-w-0 w-20 text-xs rounded-none px-1 py-0 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-accent/10"
                                autoFocus
                            />
                        ) : (
                            <Badge
                                key={index}
                                variant="outline"
                                className={cn(
                                    "text-xs cursor-pointer hover:bg-accent/50 rounded-none h-[22px] flex items-center px-2 group",
                                    getTagColor(tag)
                                )}
                                onClick={() => setEditingTag(index)}
                            >
                                {tag}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newTags = tags.filter((_, i) => i !== index);
                                        setTags(newTags);
                                        debouncedSave({ tags: newTags });
                                    }}
                                    className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                                >
                                    ×
                                </button>
                            </Badge>
                        )
                    ))}
                    {showTagInput ? (
                        <Input
                            value={newTagInput}
                            onChange={(e) => {
                                const value = e.target.value;
                                setNewTagInput(value);
                                if (!value.trim()) {
                                    setShowTagInput(false);
                                    setNewTagInput('');
                                }
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    setShowTagInput(false);
                                    setNewTagInput('');
                                }, 100);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newTagInput.trim()) {
                                    handleAddTag();
                                }
                                if (e.key === 'Escape') {
                                    setShowTagInput(false);
                                    setNewTagInput('');
                                }
                            }}
                            className="h-[22px] min-w-0 w-16 text-xs rounded-none px-1 py-0 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-accent/10"
                            autoFocus
                        />
                    ) : (
                        <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-accent/50 rounded-none h-[22px] w-[22px] flex items-center justify-center relative group"
                            onClick={() => {
                                setShowTagInput(true);
                                setNewTagInput('');
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center bg-accent/0 group-hover:bg-accent/30 transition-colors">
                                <Plus className="h-3 w-3 text-white" />
                            </div>
                        </Badge>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
} 