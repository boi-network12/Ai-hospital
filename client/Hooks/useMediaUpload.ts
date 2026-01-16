import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { apiFetch } from '@/Utils/api';
import { useAuth } from '@/Hooks/authHook.d';
import { useToast } from '@/Hooks/useToast.d';

interface MediaFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileCategory: string;
  thumbnailUrl?: string;
  publicId: string;
}

interface UseMediaUploadReturn {
  isUploading: boolean;
  progress: number;
  uploadFile: (file: MediaFile) => Promise<UploadResult>;
  pickImage: () => Promise<MediaFile | null>;
  pickVideo: () => Promise<MediaFile | null>;
  pickDocument: () => Promise<MediaFile | null>;
  compressImage: (uri: string) => Promise<string>;
}

// Define progress event type
interface UploadProgressEvent {
  loaded: number;
  total: number;
}

export const useMediaUpload = (): UseMediaUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { auth } = useAuth();
  const { showAlert } = useToast();

  const requestPermissions = useCallback(async () => {
    // Request media library permissions
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (mediaStatus !== 'granted') {
      showAlert({
        message: 'Sorry, we need media library permissions to upload files.',
        type: 'error'
      });
      return false;
    }
    
    // Request camera permissions if needed
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraStatus !== 'granted') {
      showAlert({
        message: 'Sorry, we need camera permissions to take photos.',
        type: 'error'
      });
      return false;
    }
    
    return true;
  }, [showAlert]);

  const compressImage = useCallback(async (uri: string): Promise<string> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // Check if file exists and has size
      if (fileInfo.exists && 'size' in fileInfo && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
        // Use a temporary file name
        const tempUri = `${LegacyFileSystem.documentDirectory}compressed_${Date.now()}.jpg`;
        
        // For actual compression, you might want to use ImageManipulator
        // or another compression library
        await FileSystem.copyAsync({
          from: uri,
          to: tempUri
        });
        
        return tempUri;
      }
      
      return uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  }, []);

  const uploadFile = useCallback(async (file: MediaFile): Promise<UploadResult> => {
    if (!auth.accessToken) {
      throw new Error('No authentication token');
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      
      // In React Native, we need to create the file object differently
      // Convert the URI to a blob-like object
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      // Create a File object if needed, or use the blob directly
      const fileObject = {
        uri: file.uri,
        type: file.type,
        name: file.name,
      };
      
      formData.append('file', fileObject as any);
      
      // Upload to server
      // Note: You'll need to modify your apiFetch to handle progress events
      const responseData = await apiFetch('/upload/media', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type manually for FormData
          // Let the browser set it with the boundary
        },
      });

      // If you need upload progress, you might need to use XMLHttpRequest directly
      // or modify your apiFetch implementation

      if (responseData.success) {
        return responseData.data;
      } else {
        throw new Error(responseData.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showAlert({
        message: error.message || 'Failed to upload file',
        type: 'error'
      });
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [auth.accessToken, showAlert]);

  const pickImage = useCallback(async (): Promise<MediaFile | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Get file info - handle the type properly
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        // Extract file name from URI if not provided
        const fileName = asset.fileName || 
          asset.uri.split('/').pop() || 
          `image_${Date.now()}.jpg`;
        
        // Get file size safely
        let fileSize = 0;
        if (fileInfo.exists && 'size' in fileInfo) {
          fileSize = fileInfo.size || 0;
        }
        
        return {
          uri: asset.uri,
          name: fileName,
          type: asset.mimeType || 'image/jpeg',
          size: fileSize,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert({
        message: 'Failed to pick image',
        type: 'error'
      });
      return null;
    }
  }, [requestPermissions, showAlert]);

  const pickVideo = useCallback(async (): Promise<MediaFile | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        // Extract file name from URI if not provided
        const fileName = asset.fileName || 
          asset.uri.split('/').pop() || 
          `video_${Date.now()}.mp4`;
        
        // Get file size safely
        let fileSize = 0;
        if (fileInfo.exists && 'size' in fileInfo) {
          fileSize = fileInfo.size || 0;
        }
        
        return {
          uri: asset.uri,
          name: fileName,
          type: asset.mimeType || 'video/mp4',
          size: fileSize,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error picking video:', error);
      showAlert({
        message: 'Failed to pick video',
        type: 'error'
      });
      return null;
    }
  }, [requestPermissions, showAlert]);

  const pickDocument = useCallback(async (): Promise<MediaFile | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        return {
          uri: asset.uri,
          name: asset.name || `document_${Date.now()}`,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error picking document:', error);
      showAlert({
        message: 'Failed to pick document',
        type: 'error'
      });
      return null;
    }
  }, [showAlert]);

  return {
    isUploading,
    progress,
    uploadFile,
    pickImage,
    pickVideo,
    pickDocument,
    compressImage,
  };
};