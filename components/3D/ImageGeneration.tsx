import React, { useState, useCallback } from 'react';
import { generateImage } from '@/lib/fal.ai/fal';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { toast } from 'sonner';
import { ChatInstance } from './ChatInstance';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { PromptTranslator } from './PromptTranslator';
import { supabase } from '@/lib/supabase/supabase';

interface ImageGenerationProps {
    onImageSelect: (imageUrl: string) => void;
    numImages?: number;
    user?: any;
    setShowAuthModal?: (show: boolean) => void;
}

export function ImageGeneration({ onImageSelect, numImages = 2, user, setShowAuthModal }: ImageGenerationProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<Array<{ url: string }>>([]);
    const [currentPrompt, setCurrentPrompt] = useState<string>('');
    const [inputValue, setInputValue] = useState('');
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const { theme } = useTheme();
    const [isProcessing, setIsProcessing] = useState(false);
    const { currentLanguage } = useTranslation();
    const [translatedPrompt, setTranslatedPrompt] = useState<string>('');

    const handleCloseModal = useCallback(() => {
        if (generatedImages.length > 0 && !isGenerating) {
            setShowCloseConfirm(true);
        } else {
            setShowModal(false);
        }
    }, [generatedImages.length, isGenerating]);

    const handleConfirmClose = useCallback(() => {
        setShowCloseConfirm(false);
        setShowModal(false);
        setGeneratedImages([]);
        setCurrentPrompt('');
        setInputValue('');
        setSelectedImageUrl(null);
    }, []);

    const handlePromptSubmit = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;

        try {
            if (!user) {
                setShowAuthModal?.(true);
                return;
            }

            // Check user's ROIDS balance before proceeding
            const { data: userRoids, error: roidsError } = await supabase
                .from('user_roids')
                .select('balance')
                .eq('user_id', user.id)
                .single();

            if (roidsError) {
                toast.error('Error checking ROIDS balance');
                return;
            }

            if (!userRoids || userRoids.balance < 5) {
                toast.error('Insufficient ROIDS balance', {
                    description: 'You need 5 ROIDS to generate images'
                });
                return;
            }

            setIsGenerating(true);
            setShowModal(true);
            setCurrentPrompt(prompt);
            setSelectedImageUrl(null);

            console.log('Original prompt:', prompt);

            // Check if text contains non-ASCII characters (needs translation)
            const nonAsciiCount = (prompt.match(/[^\x00-\x7F]/g) || []).length;
            const needsTranslation = nonAsciiCount > 0;

            let finalPrompt = prompt;
            if (needsTranslation) {
                // Only translate if text contains non-English characters
                const translationResponse = await fetch('/api/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: prompt, sourceLang: 'ja' }),
                });

                if (!translationResponse.ok) {
                    throw new Error('Translation failed');
                }

                const translationData = await translationResponse.json();
                finalPrompt = translationData.translation || prompt;
                console.log('Translation received:', finalPrompt);
            } else {
                console.log('Text is already in English, skipping translation');
            }

            // Use the translated text for image generation
            const cleanPrompt = finalPrompt.replace(/\b(3d|3D|three dimensional|3-d)\b/g, '').trim();
            console.log('Final prompt being sent to image generation:', cleanPrompt);

            const result = await generateImage({
                prompt: cleanPrompt,
                num_images: 2,
                image_size: "square_hd",
                guidance_scale: 8.5,
                num_inference_steps: 40
            });

            // Deduct ROIDS after successful generation
            const { error: deductionError } = await supabase.rpc('deduct_roids', {
                p_user_id: user.id,
                p_amount: 5,
                p_description: 'Image generation cost'
            });

            if (deductionError) {
                console.error('Error deducting ROIDS:', deductionError);
                toast.error('Error deducting ROIDS');
                return;
            }

            setGeneratedImages(result.images);
        } catch (error) {
            console.error('Error generating images:', error);
            toast.error('Failed to generate images. Please try again.');
            setShowModal(false);
        } finally {
            setIsGenerating(false);
            setTranslatedPrompt(''); // Reset translated prompt for next use
        }
    }, [user, setShowAuthModal]);

    const handleImageClick = useCallback((imageUrl: string) => {
        setSelectedImageUrl(imageUrl === selectedImageUrl ? null : imageUrl);
    }, [selectedImageUrl]);

    const handleImageSelect = useCallback(async () => {
        if (!selectedImageUrl) return;

        try {
            setIsProcessing(true);
            await onImageSelect(selectedImageUrl);
            setShowModal(false);
            setGeneratedImages([]);
            setCurrentPrompt('');
            setInputValue('');
            setSelectedImageUrl(null);
        } catch (error) {
            console.error('Error processing generated image:', error);
            toast.error('Failed to process the generated image');
        } finally {
            setIsProcessing(false);
        }
    }, [selectedImageUrl, onImageSelect]);

    return (
        <>
            <div className="max-w-3xl mx-auto px-2 sm:px-0 relative">
                <ChatInstance
                    onPromptSubmit={handlePromptSubmit}
                    isUploading={isGenerating}
                    showPreview={false}
                    user={user}
                    setShowAuthModal={setShowAuthModal}
                    onFileSelect={() => { }}
                    value={inputValue}
                    onChange={setInputValue}
                />
                {currentPrompt && (
                    <PromptTranslator
                        originalPrompt={currentPrompt}
                        onTranslatedPrompt={setTranslatedPrompt}
                        className="mt-2"
                        sourceLang={currentLanguage}
                    />
                )}
            </div>

            <Dialog open={showModal} onOpenChange={handleCloseModal}>
                <DialogContent className="max-w-[600px] p-4 bg-background/95 backdrop-blur-md border-none rounded-none" hideClose>
                    <DialogTitle className="sr-only">Generated Images</DialogTitle>
                    <div className="relative">
                        <div className="grid grid-cols-2 gap-4 p-4">
                            {isGenerating ? (
                                <div className="col-span-2 flex items-center justify-center py-8">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <p className="text-sm">{t(currentLanguage, 'ui.imageGeneration.generating')}</p>
                                    </div>
                                </div>
                            ) : (
                                generatedImages.map((image, index) => (
                                    <div
                                        key={index}
                                        className={`relative cursor-pointer group ${selectedImageUrl === image.url ? 'ring-2 ring-foreground' : ''}`}
                                        onClick={() => handleImageClick(image.url)}
                                    >
                                        <Image
                                            src={image.url}
                                            alt={`Generated image ${index + 1}`}
                                            width={512}
                                            height={512}
                                            className={`w-full h-auto transition-opacity ${selectedImageUrl === image.url ? 'opacity-100' : 'group-hover:opacity-90'}`}
                                        />
                                        <div
                                            className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center
                                                ${selectedImageUrl === image.url ? 'bg-transparent' : ''}`}
                                        >
                                            {selectedImageUrl === image.url && (
                                                <div className="w-4 h-4 rounded-full bg-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!isGenerating && generatedImages.length > 0 && (
                            <div className="flex justify-center p-4">
                                <Button
                                    onClick={handleImageSelect}
                                    disabled={!selectedImageUrl || isProcessing}
                                    variant="outline"
                                    size="default"
                                    className="hover:bg-foreground hover:text-background transition-colors rounded-none text-xs font-medium px-4"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>{t(currentLanguage, 'ui.imageGeneration.processing')}</span>
                                        </div>
                                    ) : (
                                        t(currentLanguage, 'ui.imageGeneration.useSelectedImage')
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
                <AlertDialogContent className="rounded-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t(currentLanguage, 'ui.imageGeneration.closeConfirm.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(currentLanguage, 'ui.imageGeneration.closeConfirm.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none" onClick={() => setShowCloseConfirm(false)}>
                            {t(currentLanguage, 'ui.imageGeneration.closeConfirm.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-none bg-red-500 hover:bg-red-600"
                            onClick={handleConfirmClose}
                        >
                            {t(currentLanguage, 'ui.imageGeneration.closeConfirm.close')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}