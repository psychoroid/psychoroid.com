/**
 * Compresses an image URL to a maximum size while maintaining aspect ratio
 * @param imageUrl The URL of the image to compress
 * @returns A promise that resolves to the compressed image data URL
 */
export async function compressImage(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                resolve(imageUrl); // Fallback to original if canvas not supported
                return;
            }

            // Target size: 800x800 max while maintaining aspect ratio
            const maxSize = 800;
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
            
            // Draw image with proper scaling
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.85 quality (good balance between size and quality)
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressedUrl);
        };

        img.onerror = () => resolve(imageUrl); // Fallback to original on error
        img.src = imageUrl;
    });
} 