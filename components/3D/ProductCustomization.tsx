import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Lock, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabase';
import { toast } from 'sonner';
import type { CommunityProduct } from '@/types/community';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/actions/utils";
import { getTagColor } from '@/lib/utils/tagColors';
import { motion } from 'framer-motion';

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

    // Fetch product details on mount
    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
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

        if (product.id !== 'temp-id') {
            fetchProductDetails();
        } else {
            setIsLoading(false);
            setName(product.name);
            setDescription(product.description || '');
            setTags(product.tags || []);
            setVisibility(product.visibility);
        }
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

    const saveChanges = async () => {
        if (!product.id || product.id === 'temp-id') return;

        try {
            const { error } = await supabase.rpc('update_product_content', {
                p_product_id: product.id,
                p_name: name,
                p_description: description || null,
                p_tags: tags || []
            });

            if (error) throw error;
            toast.success('Changes saved');
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to save changes');
        }
    };

    const handleNameSubmit = async () => {
        setIsEditingName(false);
        await saveChanges();
    };

    const handleDescriptionSubmit = async () => {
        setIsEditingDescription(false);
        await saveChanges();
    };

    const handleTagEdit = async (index: number, newValue: string) => {
        const newTags = [...tags];
        if (newValue.trim()) {
            newTags[index] = newValue.trim();
            setTags(newTags);
            await saveChanges();
        } else {
            newTags.splice(index, 1);
            setTags(newTags);
            await saveChanges();
        }
        setEditingTag(null);
    };

    const handleAddTag = async () => {
        if (newTagInput.trim()) {
            const newTags = [...tags, newTagInput.trim()];
            setTags(newTags);
            setNewTagInput('');
            setShowTagInput(false);
            await saveChanges();
        }
    };

    if (isLoading) {
        return (
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="h-8 w-8 bg-accent/50 rounded-none"></div>
                    <div className="h-8 w-8 bg-accent/50 rounded-none"></div>
                </div>
            </div>
        );
    }

    // Return nothing if it's a temporary product
    if (product.id === 'temp-id') {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-4 flex flex-col gap-2"
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
                            className="w-48 text-sm rounded-none"
                            autoFocus
                        />
                    ) : (
                        <span className="text-sm text-foreground cursor-pointer hover:text-accent" onClick={() => setIsEditingName(true)}>
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
                >
                    {isEditingDescription ? (
                        <Input
                            ref={textareaRef as any}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescriptionSubmit}
                            className="w-auto min-w-[200px] text-sm rounded-none"
                            autoFocus
                        />
                    ) : (
                        <span
                            className="text-sm text-muted-foreground cursor-pointer hover:text-accent"
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
                                onChange={(e) => handleTagEdit(index, e.target.value)}
                                onBlur={() => handleTagEdit(index, tag)}
                                onKeyDown={(e) => e.key === 'Enter' && handleTagEdit(index, tag)}
                                className="w-24 text-xs rounded-none"
                                autoFocus
                            />
                        ) : (
                            <Badge
                                key={index}
                                variant="outline"
                                className={cn(
                                    "text-xs cursor-pointer hover:bg-accent/50 rounded-[4px]",
                                    getTagColor(tag)
                                )}
                                onClick={() => setEditingTag(index)}
                            >
                                {tag}
                            </Badge>
                        )
                    ))}
                    {showTagInput ? (
                        <Input
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onBlur={() => {
                                handleAddTag();
                                setShowTagInput(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddTag();
                                    setShowTagInput(false);
                                }
                            }}
                            placeholder="Add tag..."
                            className="w-24 text-xs rounded-none"
                            autoFocus
                        />
                    ) : (
                        <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-accent/50 rounded-[4px] h-[22px] flex items-center justify-center"
                            onClick={() => setShowTagInput(true)}
                        >
                            <Plus className="h-3 w-3" />
                        </Badge>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
} 