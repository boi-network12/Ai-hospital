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
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
// import AllTestsHeader from '@/components/Headers/AllTestsHeader';
import { useRouter } from 'expo-router';
import { _MiddleDisplayContent } from '@/constants/ResolveDisplay';
import { Image } from 'expo-image';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';

const blurhash = BLUR_HASH_PLACEHOLDER;


export default function AllTests() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    }
  }, []);

  // Then use LayoutAnimation for layout changes:
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  // Animation refs for staggered entrance
  const fadeAnims = useRef(
    _MiddleDisplayContent.map(() => new Animated.Value(0))
  ).current;

  // Progress animations for unavailable items
  const progressWidths = useRef(
    _MiddleDisplayContent.map(() => new Animated.Value(0))
  ).current;

  // Staggered fade-in + scale on mount
  useEffect(() => {
    const animations = fadeAnims.map((anim, i) =>
      Animated.spring(anim, {
        toValue: 1,
        friction: 7,
        delay: i * 50,
        useNativeDriver: true,
      })
    );

    // Animate progress bars for unavailable items after entrance
    const progressAnimations = fadeAnims.map((_, i) => {
      if (!_MiddleDisplayContent[i].router) {
        return Animated.timing(progressWidths[i], {
          toValue: 0.4, // 40% width
          duration: 800,
          delay: 400 + (i * 100),
          useNativeDriver: false, // Must be false for width animation
        });
      }
      return null;
    }).filter(Boolean);

    Animated.stagger(50, animations).start(() => {
      Animated.parallel(progressAnimations as Animated.CompositeAnimation[]).start();
    });
  }, [fadeAnims, progressWidths]);


  const handleItemPress = (item: any) => {
    if (item.router) {
      router.push(item.router as any);
    } else {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      // Optional: Show a toast/modal for unavailable items
    }
  };

  // Render each card with press animation
  const renderCard = ({ item, index }: { item: any; index: number }) => {
    const animValue = fadeAnims[index];
    const progressAnim = progressWidths[index];
    const isAvailable = !!item.router;

    const onPressIn = () => {
      if (isAvailable) {
        Animated.spring(scale, {
          toValue: 0.96,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    };

    const onPressOut = () => {
      if (isAvailable) {
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    };

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: animValue,
            transform: [{ scale: animValue }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={isAvailable ? 0.7 : 1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleItemPress(item)}
          disabled={!isAvailable}
          style={[
            styles.card,
            !isAvailable && styles.disabledCard,
          ]}
        >
          {/* Unavailable Overlay */}
          {!isAvailable && (
            <View style={styles.unavailableOverlay}>
              <View style={styles.comingSoonBadge}>
                <Ionicons name="time-outline" size={hp(1.4)} color="#fff" />
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
          )}

          {/* Image or Icon Container */}
          <View style={[
            styles.imageContainer,
            !isAvailable && styles.disabledImageContainer,
          ]}>
            {item.image ? (
              <Image
                source={item.image}
                style={styles.cardImage}
                placeholder={{ blurhash }}
                transition={600}
                contentFit="cover"
              />
            ) : (
              <View style={styles.iconContainer}>
                <MaterialIcons 
                  name="medical-services" 
                  size={hp(5)} 
                  color={isAvailable ? "#8089ff" : "#ccc"} 
                />
              </View>
            )}
            
            {/* Availability Indicator */}
            <View style={[
              styles.availabilityIndicator,
              isAvailable ? styles.availableIndicator : styles.unavailableIndicator,
            ]}>
              {isAvailable ? (
                <Feather name="check-circle" size={hp(1.2)} color="#4CAF50" />
              ) : (
                <Feather name="clock" size={hp(1.2)} color="#FF9800" />
              )}
            </View>
          </View>

          {/* Card Content */}
          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Text style={[
                styles.cardTitle,
                !isAvailable && styles.disabledTitle,
              ]}>
                {item.name}
              </Text>
              {!isAvailable && (
                <MaterialIcons 
                  name="lock-outline" 
                  size={hp(1.4)} 
                  color="#999" 
                />
              )}
            </View>
            
            <Text style={[
              styles.cardDescription,
              !isAvailable && styles.disabledDescription,
            ]} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Status Footer */}
            <View style={styles.statusFooter}>
              {isAvailable ? (
                <View style={styles.availableFooter}>
                  <Text style={styles.availableText}>Available</Text>
                  <MaterialIcons 
                    name="arrow-forward-ios" 
                    size={hp(1.2)} 
                    color="#8089ff" 
                  />
                </View>
              ) : (
                <View style={styles.unavailableFooter}>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <Animated.View 
                        style={[
                          styles.progressFill,
                          {
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            }),
                          },
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>In Development</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.AllTestWrapper}>
      <GeneralSettingsHeader
        title="Lab Testing"
        returnBtn={() => router.back()}
      />

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {_MiddleDisplayContent.filter(item => item.router).length}
          </Text>
          <Text style={styles.statLabel}>Available Tests</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.upcomingNumber]}>
            {_MiddleDisplayContent.filter(item => !item.router).length}
          </Text>
          <Text style={styles.statLabel}>Coming Soon</Text>
        </View>
      </View>

      <View style={styles.flexContainer}>
        <FlatList
          data={_MiddleDisplayContent}
          keyExtractor={(_, i) => i.toString()}
          numColumns={2}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8089ff"
              colors={['#8089ff']}
            />
          }
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={renderCard}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              Medical Diagnostics & Tests
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

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
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#f8f9ff',
    marginHorizontal: hp(2),
    marginTop: hp(1),
    marginBottom: hp(2),
    padding: hp(2),
    borderRadius: hp(1),
    borderWidth: 1,
    borderColor: 'rgba(128, 137, 255, 0.1)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: hp(3),
    fontWeight: 'bold',
    color: '#8089ff',
  },
  upcomingNumber: {
    color: '#FF9800',
  },
  statLabel: {
    fontSize: hp(1.3),
    color: '#666',
    marginTop: hp(0.5),
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(128, 137, 255, 0.2)',
  },
  listContent: {
    paddingTop: hp(1),
    paddingBottom: hp(4),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: '#444',
    marginBottom: hp(2),
    marginTop: hp(1),
    paddingHorizontal: hp(0.5),
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
    borderRadius: hp(1.5),
    borderWidth: 0.5,
    borderColor: 'rgba(128, 137, 255, 0.15)',
    overflow: 'hidden'
  },
  disabledCard: {
    borderColor: 'rgba(200, 200, 200, 0.3)',
    backgroundColor: 'rgba(250, 250, 250, 0.8)',
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 10,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: hp(1),
    left: hp(1),
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingHorizontal: hp(1),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(0.5),
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: hp(1.1),
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 137, 255, 0.1)',
    overflow: 'hidden',
  },
  disabledImageContainer: {
    backgroundColor: 'rgba(200, 200, 200, 0.05)',
    borderBottomColor: 'rgba(200, 200, 200, 0.1)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityIndicator: {
    position: 'absolute',
    bottom: hp(1),
    right: hp(1),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: hp(1),
    padding: hp(0.5),
  },
  availableIndicator: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  unavailableIndicator: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  cardContent: {
    padding: hp(1.5),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  cardTitle: {
    fontSize: hp(1.7),
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  disabledTitle: {
    color: '#999',
  },
  cardDescription: {
    fontSize: hp(1.3),
    color: '#666',
    lineHeight: hp(1.8),
    marginBottom: hp(1),
  },
  disabledDescription: {
    color: '#aaa',
  },
  statusFooter: {
    marginTop: hp(0.5),
  },
  availableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp(0.5),
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 137, 255, 0.1)',
  },
  availableText: {
    fontSize: hp(1.2),
    color: '#8089ff',
    fontWeight: '500',
  },
  unavailableFooter: {
    paddingTop: hp(0.5),
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: hp(0.4),
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderRadius: hp(0.2),
    overflow: 'hidden',
    marginBottom: hp(0.5),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8089ff',
    borderRadius: hp(0.2),
  },
  progressText: {
    fontSize: hp(1),
    color: '#999',
    textAlign: 'center',
  },
});