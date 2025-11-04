import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'neuromed';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText((prev) => prev + fullText[index]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onAnimationComplete?.();
        }, 500);
      }
    }, 150); // typing speed

    return () => clearInterval(interval);
  }, [onAnimationComplete]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(800)}
        exiting={FadeOut.duration(500)}
        style={styles.iconLogoContainer}
      >
        <View style={styles.miniTextContainer}>
          <Text style={styles.miniText}>{displayText}</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8089ff',
    width: '100%',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLogoContainer: {
    width: wp(25),
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: hp(1),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  miniTextContainer: {
    backgroundColor: '#8089ff',
    width: "75%",
    height: "20%",
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniText: {
    color: '#fff',
    fontSize: hp(1.5),
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
