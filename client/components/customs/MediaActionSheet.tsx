import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { height } = Dimensions.get('window');

interface MediaActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  onPickDocument: () => void;
  onRecordAudio?: () => void;
}

const MediaActionSheet: React.FC<MediaActionSheetProps> = ({
  visible,
  onClose,
  onTakePhoto,
  onPickImage,
  onPickVideo,
  onPickDocument,
  onRecordAudio,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 20,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
        tension: 100,
        friction: 20,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleAction = (action: () => void) => {
    onClose();
    setTimeout(action, 300); // Wait for animation
  };

  const actions = [
    {
      id: 'camera',
      label: 'Take Photo',
      icon: 'camera' as const,
      color: '#2196F3',
      onPress: () => handleAction(onTakePhoto),
    },
    {
      id: 'image',
      label: 'Choose Photo',
      icon: 'image' as const,
      color: '#4CAF50',
      onPress: () => handleAction(onPickImage),
    },
    {
      id: 'video',
      label: 'Choose Video',
      icon: 'video' as const,
      color: '#FF9800',
      onPress: () => handleAction(onPickVideo),
    },
    {
      id: 'document',
      label: 'Choose Document',
      icon: 'file' as const,
      color: '#9C27B0',
      onPress: () => handleAction(onPickDocument),
    },
    {
      id: 'audio',
      label: 'Record Audio',
      icon: 'mic' as const,
      color: '#F44336',
      onPress: () => onRecordAudio && handleAction(onRecordAudio),
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={styles.blurView}>
              <View style={styles.sheetContent}>
                {actions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.actionButton}
                    onPress={action.onPress}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
                      <Feather name={action.icon} size={24} color={action.color} />
                    </View>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              
              <SafeAreaView style={styles.safeArea} />
            </BlurView>
          ) : (
            <View style={styles.androidSheet}>
              <View style={styles.sheetContent}>
                {actions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.actionButton}
                    onPress={action.onPress}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
                      <Feather name={action.icon} size={24} color={action.color} />
                    </View>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.cancelButtonAndroid}
                onPress={onClose}
              >
                <Text style={styles.cancelTextAndroid}>Cancel</Text>
              </TouchableOpacity>
              
              <SafeAreaView style={styles.safeArea} />
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurView: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  androidSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContent: {
    padding: hp(2),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: hp(2),
    borderRadius: 12,
    marginBottom: hp(1),
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hp(2),
  },
  actionLabel: {
    fontSize: hp(1.8),
    fontWeight: '500',
    color: '#333',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: hp(2),
    alignItems: 'center',
    marginTop: hp(1),
  },
  cancelText: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonAndroid: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: hp(2),
    alignItems: 'center',
    margin: hp(2),
    marginTop: hp(1),
  },
  cancelTextAndroid: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#f44336',
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
});

export default MediaActionSheet;