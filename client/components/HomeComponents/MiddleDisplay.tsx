import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { Image } from 'expo-image';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import { router } from 'expo-router';

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
            onPress={() => router.push(item.router as any)}
          >
            <View style={styles.ImageContainer}>
              <Image
                source={item.image}
                style={{ width: '60%', aspectRatio: 1 }}
                transition={1000}
                placeholder={{ blurhash }}
                contentFit="contain"
              />
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
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
          <Text style={styles.seeMoreText}>See More →</Text>
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
    borderWidth: 0.6,
    borderColor: '#eee',
    marginRight: hp(2),
    padding: hp(1.2),
    paddingVertical: hp(2),
    borderRadius: hp(1.5),
    width: hp(16),
    backgroundColor: '#fff',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 2,
    // elevation: 2,
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
  },
  itemName: {
    fontSize: hp(1.7),
    fontWeight: '600',
    textAlign: 'left',
    color: '#333',
  },
  itemDescription: {
    fontSize: hp(1.3),
    textAlign: 'left',
    color: '#8089ff',
    marginTop: hp(3),
    opacity: 0.6,
    fontWeight: '500',
    lineHeight: hp(1.5)
  },
  seeMoreBox: {
    backgroundColor: '#8089ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8089ff',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  seeMoreText: {
    color: '#fff',
    fontSize: hp(1.7),
    fontWeight: '600',
  }
});
