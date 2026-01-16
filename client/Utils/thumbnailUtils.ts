// utils/thumbnailUtils.ts
export const generateThumbnailUrl = (
  fileUrl: string | null | undefined,
  messageType: 'image' | 'video' | 'audio' | 'file' | 'text'
): string | null => {
  if (!fileUrl) return null;
  
  // For video messages, you might want to generate a thumbnail
  // Here are some approaches:
  
  // 1. If using a video service that provides thumbnails
  // Example: Cloudinary, AWS S3 with video processing, etc.
  // return `${fileUrl}-thumbnail.jpg`;
  
  // 2. For local videos, you might need to generate thumbnails on upload
  // This would typically be done server-side
  
  // 3. Placeholder based on message type
  switch (messageType) {
    case 'video':
      // Return a placeholder or use a thumbnail service
      // For now, return null and handle in UI
      return null;
    case 'image':
      return fileUrl; // Images are their own thumbnails
    default:
      return null;
  }
};

// Alternative: Create a fallback thumbnail component
export const getThumbnailFallback = (messageType: string, fileName?: string): string => {
  switch (messageType) {
    case 'video':
      return '🎬';
    case 'audio':
      return '🎵';
    case 'file':
      const ext = fileName?.split('.').pop()?.toLowerCase() || 'file';
      const fileIcons: Record<string, string> = {
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        xls: '📊',
        xlsx: '📊',
        ppt: '📊',
        pptx: '📊',
        zip: '📦',
        rar: '📦',
        txt: '📄',
        default: '📎'
      };
      return fileIcons[ext] || fileIcons.default;
    default:
      return '📎';
  }
};