import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { Image } from 'expo-image';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import { router } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

interface MiddleDisplayProps {
  data: {
    name: string;
    image: string | null;
    description: string;
    router?: string | null;
  }[]
}

const blurhash = BLUR_HASH_PLACEHOLDER;

export default function MiddleDisplay({ data }: MiddleDisplayProps) {
  const displayData = data.slice(0, 3);

  // 🌀 Animate scale on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handlePress = (item: typeof displayData[0]) => {
    if (item.router) {
      router.push(item.router as any);
    } else {
      // Optional: Add haptic feedback for unavailable items
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim }] }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={{ paddingRight: hp(2) }}
      >
        {displayData.map((item, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.BoxContainer,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }
            ]}
            onPress={() => handlePress(item)}
            disabled={!item.router}
          >
            {/* Unavailable Overlay */}
            {!item.router && (
              <View style={styles.unavailableOverlay}>
                <View style={styles.unavailableBadge}>
                  <Ionicons name="time-outline" size={hp(1.5)} color="#fff" />
                  <Text style={styles.unavailableText}>Soon</Text>
                </View>
              </View>
            )}

            <View style={[
              styles.ImageContainer,
              !item.router && styles.disabledImageContainer
            ]}>
              {item.image ? (
                <Image
                  source={item.image}
                  style={{ width: '70%', aspectRatio: 1 }}
                  transition={1000}
                  placeholder={{ blurhash }}
                  contentFit="contain"
                />
              ) : (
                <MaterialIcons 
                  name="medical-services" 
                  size={hp(3)} 
                  color={item.router ? "#8089ff" : "#ccc"} 
                />
              )}
              
              {/* Coming Soon Icon for unavailable items */}
              {!item.router && (
                <View style={styles.comingSoonIcon}>
                  <MaterialIcons name="hourglass-empty" size={hp(1.2)} color="#ff6b6b" />
                </View>
              )}
            </View>
            
            <Text style={[
              styles.itemName,
              !item.router && styles.disabledText
            ]}>
              {item.name}
              {!item.router && (
                <MaterialIcons 
                  name="lock-outline" 
                  size={hp(1.2)} 
                  color="#999" 
                  style={{ marginLeft: hp(0.5) }}
                />
              )}
            </Text>
            
            <Text style={[
              styles.itemDescription,
              !item.router && styles.disabledDescription
            ]}>
              {item.description}
            </Text>

            {/* Progress bar for upcoming features */}
            {!item.router && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
                <Text style={styles.progressText}>In development</Text>
              </View>
            )}

            {/* Arrow indicator for available items */}
            {item.router && (
              <View style={styles.arrowContainer}>
                <MaterialIcons name="arrow-forward-ios" size={hp(1.2)} color="#8089ff" />
              </View>
            )}
          </Pressable>
        ))}

        {/* ✅ See More box with subtle pulse */}
        <Pressable
          style={({ pressed }) => [
            styles.BoxContainer,
            styles.seeMoreBox,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }
          ]}
          onPress={() => router.push('/all-tests')}
        >
          <View style={styles.seeMoreIcon}>
            <Ionicons name="chevron-forward-circle" size={hp(3.5)} color="#fff" />
          </View>
          <Text style={styles.seeMoreText}>See More</Text>
          <Text style={styles.seeMoreSubText}>Explore all tests</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  BoxContainer: {
    borderWidth: 0.4,
    borderColor: '#eee',
    marginRight: hp(2),
    padding: hp(1.2),
    paddingVertical: hp(2),
    borderRadius: hp(1.5),
    width: hp(18),
    backgroundColor: '#fff',
  },
  ImageContainer: {
    width: hp(6),
    aspectRatio: 1,
    backgroundColor: "rgba(128, 137, 255, 0.05)",
    borderRadius: hp(1),
    marginBottom: hp(1),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 0.2,
    borderColor: 'rgba(128, 137, 255, 0.1)',
  },
  disabledImageContainer: {
    backgroundColor: "rgba(200, 200, 200, 0.05)",
    borderColor: 'rgba(200, 200, 200, 0.2)',
  },
  itemName: {
    fontSize: hp(1.7),
    fontWeight: '600',
    textAlign: 'left',
    color: '#333',
    marginBottom: hp(0.5),
  },
  disabledText: {
    color: '#999',
    opacity: 0.7,
  },
  itemDescription: {
    fontSize: hp(1.3),
    textAlign: 'left',
    color: '#8089ff',
    marginTop: hp(0.5),
    opacity: 0.8,
    fontWeight: '500',
    lineHeight: hp(1.5)
  },
  disabledDescription: {
    color: '#aaa',
    opacity: 0.5,
  },
  seeMoreBox: {
    backgroundColor: '#8089ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8089ff',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0,
  },
  seeMoreText: {
    color: '#fff',
    fontSize: hp(1.7),
    fontWeight: '600',
    marginTop: hp(1),
  },
  seeMoreSubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: hp(1.2),
    fontWeight: '400',
    marginTop: hp(0.5),
  },
  seeMoreIcon: {
    marginBottom: hp(0.5),
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: hp(1.5),
    zIndex: 2,
  },
  unavailableBadge: {
    position: 'absolute',
    top: hp(1),
    right: hp(1),
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: hp(0.8),
    paddingVertical: hp(0.3),
    borderRadius: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(0.3),
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  unavailableText: {
    color: '#fff',
    fontSize: hp(1.1),
    fontWeight: '600',
  },
  comingSoonIcon: {
    position: 'absolute',
    bottom: hp(0.5),
    right: hp(0.5),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: hp(1),
    padding: hp(0.3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  progressContainer: {
    marginTop: hp(1),
  },
  progressBar: {
    height: hp(0.4),
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderRadius: hp(0.2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: '#8089ff',
    borderRadius: hp(0.2),
  },
  progressText: {
    fontSize: hp(1),
    color: '#999',
    marginTop: hp(0.3),
    textAlign: 'center',
  },
  arrowContainer: {
    position: 'absolute',
    bottom: hp(1.5),
    right: hp(1.5),
  },
});
