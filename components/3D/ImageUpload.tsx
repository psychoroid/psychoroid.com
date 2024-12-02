'use client'

import React, { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { AuthModal } from '@/components/auth/AuthModal'
import { useUser } from '@/contexts/UserContext'

interface ImageUploadProps {
  onImageUpload: (imagePath: string) => void
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user } = useUser()

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

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (error) throw error

        if (data) {
          const imagePath = data.path
          onImageUpload(imagePath)

          const { data: productData, error: productError } = await supabase
            .rpc('create_product', {
              p_name: 'New Product',
              p_description: 'Product description',
              p_image_path: imagePath,
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
      if (event.target) {
        event.target.value = '' // Reset file input
      }
    }
  }, [onImageUpload, user])

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
            {uploading ? 'Uploading...' : 'Click or drag to upload product images'}
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
        <div className="mt-2 flex justify-end">
          <p className="text-xs text-gray-500">
            Supported formats: JPG, PNG (max 5MB each)
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

