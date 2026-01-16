// ImagePreviewModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImagePreviewModalProps {
  visible: boolean;
  imageUrl: string | string[];
  onClose: () => void;
  showHeader?: boolean;
  currentIndex?: number;
  type?: 'image' | 'video';
  videoThumbnail?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  visible,
  imageUrl,
  onClose,
  showHeader = true,
  currentIndex = 0,
  type = 'image',
  videoThumbnail,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(currentIndex);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isVideo, setIsVideo] = useState(type === 'video');
  
  const images = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
  const hasMultipleImages = images.length > 1 && !isVideo;

  useEffect(() => {
    if (visible) {
      setCurrentIdx(currentIndex);
      setLoading(true);
      setError(false);
      setImageDimensions(null);
      setIsVideo(type === 'video');
    }
  }, [visible, currentIndex, type]);

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
    setLoading(false);
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };

  const calculateImageSize = () => {
    if (!imageDimensions && !isVideo) {
      return { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 };
    }

    // For video, use default size
    if (isVideo) {
      const maxWidth = SCREEN_WIDTH * 0.9;
      const maxHeight = SCREEN_HEIGHT * 0.7;
      return { width: maxWidth, height: maxHeight };
    }

    const { width: imgWidth, height: imgHeight } = imageDimensions!;
    const aspectRatio = imgWidth / imgHeight;
    const maxHeight = SCREEN_HEIGHT * 0.8;
    const maxWidth = SCREEN_WIDTH * 0.9;

    let calculatedWidth = maxWidth;
    let calculatedHeight = calculatedWidth / aspectRatio;

    if (calculatedHeight > maxHeight) {
      calculatedHeight = maxHeight;
      calculatedWidth = calculatedHeight * aspectRatio;
    }

    return { width: calculatedWidth, height: calculatedHeight };
  };

  const goToNext = () => {
    if (currentIdx < images.length - 1 && !isVideo) {
      setCurrentIdx(currentIdx + 1);
      setLoading(true);
      setError(false);
      setImageDimensions(null);
    }
  };

  const goToPrevious = () => {
    if (currentIdx > 0 && !isVideo) {
      setCurrentIdx(currentIdx - 1);
      setLoading(true);
      setError(false);
      setImageDimensions(null);
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      return url.split('/').pop() || 'file';
    } catch {
      return 'file';
    }
  };

  const renderContent = () => {
    const currentImage = images[currentIdx];
    const imageSize = calculateImageSize();

    if (isVideo) {
      return (
        <View style={styles.videoPreviewContainer}>
          <View style={[styles.videoPlaceholder, imageSize]}>
            <MaterialCommunityIcons name="play-circle-outline" size={80} color="#fff" />
            <Text style={styles.videoPlaceholderText}>Video Preview</Text>
            <Text style={styles.videoFileName}>
              {getFileNameFromUrl(currentImage)}
            </Text>
            <TouchableOpacity 
              style={styles.videoPlayButton}
              onPress={() => {
                // Here you would typically open the video in a player
                // For now, we'll just show an alert
                Alert.alert(
                  'Video Playback',
                  'Would you like to download and play this video?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Download', onPress: () => {
                      // Handle video download/playback
                      console.log('Download video:', currentImage);
                    }},
                  ]
                );
              }}
            >
              <Text style={styles.videoPlayButtonText}>Play Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        {loading && (
          <View style={[styles.loadingContainer, imageSize]}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {error ? (
          <View style={[styles.errorContainer, imageSize]}>
            <MaterialCommunityIcons name="image-off-outline" size={48} color="#666" />
            <Text style={styles.errorText}>Failed to load image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: currentImage }}
            style={[styles.image, imageSize]}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {hasMultipleImages && (
          <>
            {currentIdx > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={goToPrevious}
              >
                <Feather name="chevron-left" size={30} color="#fff" />
              </TouchableOpacity>
            )}

            {currentIdx < images.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={goToNext}
              >
                <Feather name="chevron-right" size={30} color="#fff" />
              </TouchableOpacity>
            )}

            <View style={styles.indicatorContainer}>
              <Text style={styles.indicatorText}>
                {currentIdx + 1} / {images.length}
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Feather name="x" size={24} color="#fff" />
      </TouchableOpacity>
      {hasMultipleImages && (
        <Text style={styles.headerTitle}>
          {currentIdx + 1} of {images.length}
        </Text>
      )}
      {isVideo && (
        <Text style={styles.headerTitle}>Video Preview</Text>
      )}
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
        )}

        {showHeader && renderHeader()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        <SafeAreaView style={styles.safeArea} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  androidBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(4) : hp(2),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 4,
  },
  videoPreviewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: wp(4),
  },
  videoPlaceholderText: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: '600',
    marginTop: hp(2),
  },
  videoFileName: {
    color: '#999',
    fontSize: hp(1.6),
    marginTop: hp(1),
    textAlign: 'center',
  },
  videoPlayButton: {
    backgroundColor: '#8089ff',
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: 25,
    marginTop: hp(3),
  },
  videoPlayButtonText: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  errorText: {
    color: '#999',
    fontSize: hp(1.6),
    marginTop: hp(1),
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -25 }],
  },
  prevButton: {
    left: wp(4),
  },
  nextButton: {
    right: wp(4),
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: hp(2),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 20,
  },
  indicatorText: {
    color: '#fff',
    fontSize: hp(1.6),
    fontWeight: '600',
  },
});

export default ImagePreviewModal;