// app/(tabs)/all-tests/index.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AllTestsHeader from '@/components/Headers/AllTestsHeader';
import { useRouter } from 'expo-router';
import { _MiddleDisplayContent } from '@/constants/ResolveDisplay';
import { Image } from 'expo-image';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';

const blurhash = BLUR_HASH_PLACEHOLDER;

export default function AllTests() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  // Animation refs for staggered entrance
  const fadeAnims = useRef(
    _MiddleDisplayContent.map(() => new Animated.Value(0))
  ).current;

  // Staggered fade-in + scale on mount
  useEffect(() => {
    const animations = fadeAnims.map((anim, i) =>
      Animated.spring(anim, {
        toValue: 1,
        friction: 7,
        delay: i * 70,
        useNativeDriver: true,
      })
    );
    Animated.stagger(70, animations).start();
  }, [fadeAnims]);

  // Pull-to-refresh (fake for demo)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Render each card with press animation
  const renderCard = ({ item, index }: { item: any; index: number }) => {
    
    const animValue = fadeAnims[index];

    const onPressIn = () => {
      Animated.spring(scale, {
        toValue: 0.96,
        friction: 8,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: animValue,
            transform: [
              { scale: animValue },
              { scale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => router.push(item.router as any)}
          style={styles.card}
        >
          <Image
            source={item.image}
            style={styles.cardImage}
            placeholder={{ blurhash }}
            transition={600}
            contentFit="cover"
          />
          <View style={styles.cardTextWrapper}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.AllTestWrapper}>
      {/* Your original header */}
      <AllTestsHeader router={router} />

      <View style={styles.flexContainer}>
        <FlatList
          data={_MiddleDisplayContent}
          keyExtractor={(_, i) => i.toString()}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={renderCard}
        />
      </View>
    </SafeAreaView>
  );
}

// Keep your original styles — only add wrapper for animation
const styles = StyleSheet.create({
  AllTestWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  flexContainer: {
    flex: 1,
    paddingHorizontal: hp(2),
  },
  listContent: {
    paddingTop: hp(2),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  cardWrapper: {
    flex: 0.48,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: hp(1),
    width: hp(20),
    marginBottom: hp(1.5),
    padding: hp(2),
    borderWidth: 0.7,
    borderColor: '#eee',
    // Subtle shadow for depth
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.08,
    // shadowRadius: 3,
    // elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: hp(15),
    borderRadius: 8,
    marginBottom: hp(1),
    overflow: "hidden"
  },
  cardTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: hp(1.7),
    fontWeight: 'bold',
    marginBottom: hp(1),
    color: '#444',
  },
  cardDescription: {
    fontSize: hp(1.4),
    color: '#8089ff',
    opacity: 0.6
  },
});