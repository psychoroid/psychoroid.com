'use client'

import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { AuthModal } from '@/components/auth/AuthModal'
import { useUser } from '@/lib/contexts/UserContext'
import { ImageUploadProps } from '@/types/components'
import { ProductDetails } from '@/types/product'
import { PROGRESS_MESSAGES } from '@/lib/constants/progressMessages'

interface SavedProgresses {
  [key: string]: number;
}

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

  useEffect(() => {
    const fetchUserUploads = async () => {
      if (user) {
        const { data: userUploads, error: userUploadsError } = await supabase
          .rpc('get_user_uploads', { p_user_id: user.id });

        if (userUploadsError) {
          console.error('Error fetching user uploads:', userUploadsError);
        } else {
          setImagePaths(userUploads.map((upload: { image_path: string; model_path: string }) => upload.image_path));
          if (userUploads.length > 0) {
            setSelectedImage(userUploads[0].image_path);
            setModelUrl(userUploads[0].model_path);
          }
        }
      }
    };

    fetchUserUploads();
  }, [user]);

  const memoizedSelectedImage = useMemo(() => selectedImage, [selectedImage]);
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (memoizedSelectedImage) {
        const { data: productDetails, error: productDetailsError } = await supabase
          .rpc('get_product_details', {
            p_image_path: memoizedSelectedImage
          })
          .single<ProductDetails>();

        if (productDetailsError) {
          console.error('Error fetching product details:', productDetailsError);
        } else if (productDetails) {
          setModelUrl(productDetails.model_path);
          onModelUrlChange(productDetails.model_path);
        }
      }
    };

    fetchProductDetails();
  }, [memoizedSelectedImage, onModelUrlChange]);

  const onImageClick = (imagePath: string) => {
    setSelectedImage(imagePath)
  }

  const onImageRemove = (imagePath: string) => {
    setImagePaths((prevImagePaths) => prevImagePaths.filter((path) => path !== imagePath))
    if (selectedImage === imagePath) {
      setSelectedImage(null)
      setModelUrl(null)
    }
    if (imagePaths.length === 1 && imagePaths[0] === imagePath) {
      setSelectedImage(null)
      setModelUrl(null)
    }
  }

  const onPageChange = (page: number) => {
    setCurrentPage(page)
  }

  const loadSavedProgress = useCallback(() => {
    const savedProgresses = Object.keys(localStorage)
      .filter(key => key.startsWith('progress_'))
      .reduce<SavedProgresses>((acc, key) => {
        const imagePath = key.replace('progress_', '');
        const progress = parseFloat(localStorage.getItem(key) || '0');
        return { ...acc, [imagePath]: progress };
      }, {});

    Object.entries(savedProgresses).forEach(([imagePath, progress]) => {
      onProgressUpdate(imagePath, progress as number);
    });
  }, [onProgressUpdate]);

  useEffect(() => {
    loadSavedProgress();
  }, [loadSavedProgress]);

  const generate3DModel = useCallback(async (imagePath: string, onProgress: (progress: number) => void): Promise<string> => {
    const imageUrl = `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}`;

    // Initial upload - 0 to 10%
    onProgress(5);
    await new Promise(resolve => setTimeout(resolve, 500));
    onProgress(10);

    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    const file = new File([imageBlob], imagePath, { type: imageBlob.type })

    // Processing image - 10 to 15%
    onProgress(15);

    const formData = new FormData()
    formData.append('image', file)

    // Image preprocessing - 15 to 25%
    onProgress(20);
    await new Promise(resolve => setTimeout(resolve, 500));
    onProgress(25);

    const meshResponse = await fetch('http://localhost:8000/generate_mesh', {
      method: 'POST',
      body: formData,
    })

    if (!meshResponse.ok) {
      throw new Error(`Failed to generate 3D model: ${meshResponse.statusText}`)
    }

    // Mesh generation (long process) - 25 to 85%
    let currentProgress = 25;
    const progressInterval = setInterval(() => {
      if (currentProgress < 85) {
        // Slower, more consistent progress
        currentProgress += 0.2;
        onProgress(Math.min(currentProgress, 85));

        // Save current progress to localStorage
        localStorage.setItem(`progress_${imagePath}`, currentProgress.toString());
      }
    }, 3000); // Update every 3 seconds

    const meshBlob = await meshResponse.blob()
    clearInterval(progressInterval);

    // Final processing - 85 to 95%
    onProgress(90);
    await new Promise(resolve => setTimeout(resolve, 500));

    const modelFileName = `${imagePath.split('.')[0]}.glb`
    const modelPath = `models/${modelFileName}`

    // Upload to storage - 95 to 100%
    onProgress(95);

    const { data: modelData, error: modelError } = await supabase.storage
      .from('product-models')
      .upload(modelPath, meshBlob)

    if (modelError) {
      throw new Error(`Failed to upload 3D model to Supabase: ${modelError.message}`)
    }

    const { data: { publicUrl: modelUrl } } = supabase
      .storage
      .from('product-models')
      .getPublicUrl(modelPath)

    // Clear progress from localStorage when complete
    localStorage.removeItem(`progress_${imagePath}`);
    onProgress(100);

    return modelUrl
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user) {
        setShowAuthModal(true)
        return
      }

      setUploading(true)
      const files = event.target.files
      if (!files || files.length === 0) return

      const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`
        const filePath = `${fileName}`

        onProgressUpdate(filePath, 5);

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (error) throw error

        if (data) {
          const imagePath = data.path
          onImageUpload(imagePath)
          setImagePaths((prevImagePaths) => [...prevImagePaths, imagePath])

          setIsLoading(true)
          const modelUrl = await generate3DModel(imagePath, (progress) => {
            onProgressUpdate(imagePath, progress)
          })
          setModelUrl(modelUrl)
          setIsLoading(false)

          const { data: productData, error: productError } = await supabase
            .rpc('create_product', {
              p_name: 'New Product',
              p_description: 'Product description',
              p_image_path: imagePath,
              p_model_path: modelUrl,
              p_user_id: user.id
            })
            .single()

          if (productError) {
            console.error('Error creating product:', productError)
            throw new Error('Failed to create product')
          }

          return productData
        }
      })

      await Promise.all(uploadPromises)
      toast.success('Images uploaded successfully')
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Error uploading images: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setUploading(false)
      setIsLoading(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }, [onImageUpload, onProgressUpdate, generate3DModel, user])

  const getProgressMessage = (progress: number) => {
    const messageSet = PROGRESS_MESSAGES.find(set => progress <= set.threshold);
    if (!messageSet) return PROGRESS_MESSAGES[0].messages[0];
    return messageSet.messages[Math.floor(Math.random() * messageSet.messages.length)];
  };

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <label
          htmlFor="image-upload"
          className={`w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-base text-gray-500">
            {uploading ? getProgressMessage(currentProgress) : 'Click or drag to upload product images'}
          </span>
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            multiple
          />
        </label>
        <div className="mt-2 mb-4 flex justify-end">
          <p className="text-xs text-gray-500">
            Supported formats: JPG, PNG [max 5MB each]
          </p>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}

