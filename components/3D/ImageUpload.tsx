'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'
import { AuthModal } from '@/components/auth/AuthModal'
import { useUser } from '@/lib/contexts/UserContext'
import { ImageUploadProps } from '@/types/components'
import { ProductDetails } from '@/types/product'
import { PROGRESS_MESSAGES } from '@/lib/utils/progressMessages'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { generateAssetMetadata } from '@/lib/utils/assetNaming'
import { ImageGeneration } from './ImageGeneration'

interface SavedProgresses {
  [key: string]: number;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

export function ImageUpload({ onImageUpload, onModelUrlChange, onProgressUpdate }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePaths, setImagePaths] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [processingImages, setProcessingImages] = useState<{ [key: string]: number }>({})
  const { currentLanguage } = useTranslation()
  const router = useRouter()
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [currentTimeRange, setCurrentTimeRange] = useState<number>(-1);

  useEffect(() => {
    if (!selectedImage) return;

    let isMounted = true;

    const fetchProductDetails = async () => {
      try {
        const { data: productDetails, error: productDetailsError } = await supabase
          .rpc('get_product_details', {
            p_image_path: selectedImage
          })
          .single<ProductDetails>();

        if (!isMounted) return;

        if (productDetailsError) {
          console.error('Error fetching product details:', productDetailsError);
          return;
        }

        if (productDetails?.model_path) {
          onModelUrlChange(productDetails.model_path);
        }
      } catch (error) {
        console.error('Error in fetchProductDetails:', error);
      }
    };

    fetchProductDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedImage, onModelUrlChange]);

  const onImageClick = useCallback((imagePath: string) => {
    setSelectedImage(imagePath);
  }, []);

  const onImageRemove = useCallback((imagePath: string) => {
    setImagePaths(prev => prev.filter(path => path !== imagePath));

    if (selectedImage === imagePath) {
      setSelectedImage(null);
      onModelUrlChange(null);
    }
  }, [selectedImage, onModelUrlChange]);

  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const updateProgress = useCallback((imagePath: string, progress: number) => {
    setProcessingImages(prev => ({
      ...prev,
      [imagePath]: progress
    }))
    onProgressUpdate(imagePath, progress)
  }, [onProgressUpdate])

  const generate3DModel = useCallback(async (imagePath: string, onProgress: (progress: number) => void): Promise<string> => {
    /*
    // ===== BEGIN: Original Server-based Implementation =====
    const checkServerHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health')
        if (!response.ok) {
          throw new Error('Server is offline')
        }
        return true
      } catch (error) {
        toast.error(t(currentLanguage, 'ui.server.offline'), {
          description: t(currentLanguage, 'ui.server.offline_description')
        })
        return false
      }
    }

    try {
      if (!user) throw new Error('Not authenticated');

      // Check server health before proceeding
      const isServerHealthy = await checkServerHealth()
      if (!isServerHealthy) {
        throw new Error('Server is offline')
      }

      // Get the image from storage
      const imageUrl = `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();

      // Create a File object from the blob
      const fileName = imagePath.split('/').pop() || 'image.jpg';
      const file = new File([imageBlob], fileName, {
        type: imageBlob.type || 'image/jpeg'
      });

      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      // Send to server
      const meshResponse = await fetch('http://localhost:8000/generate_mesh', {
        method: 'POST',
        body: formData
      });

      if (!meshResponse.ok) {
        const errorData = await meshResponse.json();
        console.error('Server response:', errorData);
        throw new Error(`Failed to generate 3D model: ${meshResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      onProgress(90);
      const meshBlob = await meshResponse.blob();

      // Create model path
      const modelPath = `${user.id}/${Date.now()}_${fileName.split('.')[0]}.glb`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('product-models')
        .upload(modelPath, meshBlob, {
          contentType: 'model/gltf-binary',
          upsert: true
        });

      if (uploadError) throw uploadError;

      onProgress(90);
      return modelPath;

    } catch (error: any) {
      console.error('Error in generate3DModel:', error);
      if (error.message.includes('Server is offline')) {
        throw error;
      }
      throw new Error(t(currentLanguage, 'ui.model.generation_failed'));
    }
    // ===== END: Original Server-based Implementation =====
    */

    // ===== BEGIN: FAL.AI Implementation =====
    try {
      if (!user) throw new Error('Not authenticated');

      // Get the image from storage
      const imageUrl = `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();

      // Create a File object from the blob
      const fileName = imagePath.split('/').pop() || 'image.jpg';
      const file = new File([imageBlob], fileName, {
        type: imageBlob.type || 'image/jpeg'
      });

      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      // Call FAL.AI conversion endpoint
      const falResponse = await fetch('/api/fal-conversion', {
        method: 'POST',
        body: formData
      });

      if (!falResponse.ok) {
        const errorData = await falResponse.json();
        throw new Error(`Failed to generate 3D model: ${falResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      const { modelUrl, textures } = await falResponse.json();
      onProgress(90);

      // Create model path for storage
      const modelPath = `${user.id}/${Date.now()}_${fileName.split('.')[0]}.glb`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('product-models')
        .upload(modelPath, await (await fetch(modelUrl)).blob(), {
          contentType: 'model/gltf-binary',
          upsert: true
        });

      if (uploadError) throw uploadError;

      onProgress(90);
      return modelPath;

    } catch (error: any) {
      console.error('Error in generate3DModel:', error);
      throw new Error(t(currentLanguage, 'ui.model.generation_failed'));
    }
    // ===== END: FAL.AI Implementation =====
  }, [user, currentLanguage]);

  const isValidFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: t(currentLanguage, 'ui.upload.invalid_format_msg') }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: t(currentLanguage, 'ui.upload.file_too_large') }
    }

    return { valid: true }
  }, [currentLanguage]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement> & { prompt?: string }) => {
    const resetStates = () => {
      setUploading(false)
      setIsLoading(false)
      setProcessingStartTime(null)
      setCurrentTimeRange(-1)
      setCurrentMessage('')
      if (event.target) {
        event.target.value = ''
      }
    }

    try {
      if (!user) {
        setShowAuthModal(true);
        return;
      }

      // Check user's ROIDS balance before proceeding
      const { data: userRoids, error: roidsError } = await supabase
        .from('user_roids')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (roidsError || !userRoids || userRoids.balance < 25) {
        toast.error('Insufficient ROIDS balance', {
          description: 'You need 25 ROIDS to generate a 3D model'
        });
        resetStates();
        return;
      }

      const files = event.target.files;
      if (!files || files.length === 0) return;

      // Filter out invalid files
      const validFiles = Array.from(files).filter(file => {
        const validation = isValidFile(file);
        if (!validation.valid && validation.error) {
          toast.error(validation.error);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        resetStates();
        return;
      }

      setUploading(true);
      setProcessingStartTime(Date.now());

      for (const file of validFiles) {
        let filePath = '';
        try {
          setUploading(true);

          // Compress image before uploading
          const compressedBlob = await compressImageFile(file);
          const compressedFile = new File([compressedBlob], file.name, {
            type: 'image/jpeg'
          });

          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}_${file.name}`;
          filePath = fileName;

          // Upload the compressed image to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, compressedFile, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            toast.error(t(currentLanguage, 'ui.upload.failed'));
            continue;
          }

          setIsLoading(true);

          // Create initial product record
          const { data: initialProduct, error: initialProductError } = await supabase.rpc('create_product', {
            p_name: 'Processing...',
            p_description: event.prompt || 'Generated from image',
            p_image_path: filePath,
            p_model_path: null,
            p_user_id: user.id
          });

          if (initialProductError) {
            console.error('Initial product creation error:', initialProductError);
            continue;
          }

          // Create form data with compressed image
          const formData = new FormData();
          formData.append('image', compressedFile);

          // Call FAL.AI conversion endpoint with optimized headers
          const falResponse = await fetch('/api/fal-conversion', {
            method: 'POST',
            headers: {
              'Priority': 'high',
              'Purpose': 'conversion'
            },
            body: formData
          });

          if (!falResponse.ok) {
            const errorData = await falResponse.json();
            throw new Error(`FAL.AI conversion failed: ${JSON.stringify(errorData)}`);
          }

          const { modelUrl } = await falResponse.json();

          // Download and process the model in parallel with metadata generation
          const [modelBlob, metadata] = await Promise.all([
            fetch(modelUrl).then(res => res.blob()),
            generateAssetMetadata()
          ]);

          // Create model path for storage
          const modelPath = `${user.id}/${Date.now()}_${file.name.split('.')[0]}.glb`;

          // Upload to Supabase storage
          const { error: modelUploadError } = await supabase.storage
            .from('product-models')
            .upload(modelPath, modelBlob, {
              contentType: 'model/gltf-binary',
              cacheControl: '3600',
              upsert: true
            });

          if (modelUploadError) {
            throw modelUploadError;
          }

          // Update the product with model path and metadata
          const { data: updatedProduct, error: updateError } = await supabase.rpc('update_product', {
            p_image_path: filePath,
            p_model_path: modelPath,
            p_user_id: user.id,
            p_name: metadata.name,
            p_tags: metadata.tags
          });

          if (updateError) {
            console.error('Error updating product:', updateError);
            throw new Error('Failed to update product');
          }

          setImagePaths(prev => [...prev, filePath]);
          onImageUpload(filePath);

          // Construct the studio URL with both image and model parameters
          const studioUrl = `/studio?image=${encodeURIComponent(filePath)}&model=${encodeURIComponent(modelPath)}`;
          router.push(studioUrl);

          // Deduct ROIDS after successful conversion
          await supabase.rpc('deduct_roids', {
            p_user_id: user.id,
            p_amount: 25
          });

        } catch (error: any) {
          console.error('Error processing file:', error);
          toast.error(t(currentLanguage, 'ui.upload.processing_failed'));

          // Clean up the uploaded image if processing failed
          await supabase.storage
            .from('product-images')
            .remove([filePath]);
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(t(currentLanguage, 'ui.upload.error_multiple') + String(error));
    } finally {
      resetStates();
    }
  }, [
    user,
    currentLanguage,
    router,
    isValidFile,
    onImageUpload,
    setImagePaths,
    setShowAuthModal,
    setUploading,
    setIsLoading,
    setProcessingStartTime,
    setCurrentTimeRange,
    setCurrentMessage
  ]);

  // Add the image compression utility function
  const compressImageFile = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file); // Fallback to original if canvas not supported
          return;
        }

        // Target size: 1024x1024 max while maintaining aspect ratio
        const maxSize = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        // Use better quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // Fallback to original if compression fails
            }
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => resolve(file); // Fallback to original on error

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file); // Fallback to original on error
      reader.readAsDataURL(file);
    });
  };

  // Update the progress message based on elapsed time
  useEffect(() => {
    if (!uploading) {
      setProcessingStartTime(null);
      setCurrentTimeRange(-1);
      setCurrentMessage('');
      return;
    }

    if (!processingStartTime) {
      setProcessingStartTime(Date.now());
      const randomIndex = Math.floor(Math.random() * PROGRESS_MESSAGES[0].messages.length);
      setCurrentMessage(PROGRESS_MESSAGES[0].messages[randomIndex]);
      setCurrentTimeRange(0);
    }

    const intervalId = setInterval(() => {
      const elapsedTime = Date.now() - (processingStartTime || Date.now());
      const newTimeRangeIndex = PROGRESS_MESSAGES.findIndex(
        set => elapsedTime >= set.timeRange[0] && elapsedTime < set.timeRange[1]
      );

      if (newTimeRangeIndex !== -1 && newTimeRangeIndex !== currentTimeRange) {
        const messageSet = PROGRESS_MESSAGES[newTimeRangeIndex];
        const randomIndex = Math.floor(Math.random() * messageSet.messages.length);
        setCurrentMessage(messageSet.messages[randomIndex]);
        setCurrentTimeRange(newTimeRangeIndex);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [uploading, processingStartTime, currentTimeRange]);

  const getProgressPercentage = () => {
    if (!uploading) return 0;
    if (currentTimeRange === -1) return 0;

    // Calculate base progress based on current time range
    const baseProgress = (currentTimeRange / (PROGRESS_MESSAGES.length - 1)) * 90;

    // If we're in the last time range and the model URL is set, go to 100%
    if (currentTimeRange === PROGRESS_MESSAGES.length - 1 && modelUrl) {
      return 100;
    }

    return baseProgress;
  };

  const handleGeneratedImageSelect = async (imageUrl: string, prompt?: string) => {
    try {
      setUploading(true);

      // Download the image from the URL
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `generated-${Date.now()}.png`, { type: 'image/png' });

      // Create a synthetic event with the prompt
      const event = {
        target: {
          files: [file]
        },
        // Add prompt to the event
        prompt
      } as unknown as React.ChangeEvent<HTMLInputElement> & { prompt?: string };

      // Process the file using existing upload logic
      await handleFileUpload(event);
    } catch (error) {
      console.error('Error processing generated image:', error);
      toast.error('Failed to process the generated image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto px-2 sm:px-0 relative">
        <ImageGeneration
          onImageSelect={handleGeneratedImageSelect}
          numImages={4}
          user={user}
          setShowAuthModal={setShowAuthModal}
        />
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {uploading && currentMessage && (
        <div className="fixed bottom-40 left-0 right-0 flex justify-center">
          <div className="flex flex-col items-center gap-2 px-4 py-2 text-sm bg-background border border-input text-foreground shadow-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-medium">{currentMessage}</span>
            </div>
            <div className="w-full max-w-[200px] space-y-2">
              <div className="w-full bg-accent h-1">
                <div
                  className="bg-green-500 h-1 transition-all duration-300"
                  style={{
                    width: `${getProgressPercentage()}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

