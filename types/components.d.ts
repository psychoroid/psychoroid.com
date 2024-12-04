export interface ImageUploadProps {
  onImageUpload: (imagePath: string) => void;
  onModelUrlChange: (modelUrl: string | null) => void;
}

export interface ImagePreviewProps {
  imagePaths: string[];
  selectedImage: string | null;
  onImageClick: (imagePath: string) => void;
  onImageRemove: (imagePath: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export interface ProductViewerProps {
  imagePath?: string | null;
  modelUrl?: string | null;
  isRotating?: boolean;
  zoom?: number;
  isExpanded?: boolean;
  onClose?: () => void;
}

export interface ProductProps {
  imageUrl?: string | null;
  modelUrl?: string | null;
  isRotating?: boolean;
  zoom?: number;
}

export interface ProductControlsProps {
  isRotating: boolean;
  onRotateToggle: () => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExpand: () => void;
} 