import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { Image } from 'expo-image';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"

interface MiddleDisplayProps {
  data: {
    name: string;
    image: string | null;
    description: string;
  }[]
}

const blurhash = BLUR_HASH_PLACEHOLDER;

export default function MiddleDisplay({ data }: MiddleDisplayProps) {
  return (
    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.container} >
      {data.map((item, index ) => (
        <View key={index} style={styles.BoxContainer}>
          <View style={styles.ImageContainer}> 
            <Image
              source={item.image ? { uri: item.image } : undefined}
              style={{
                width: '60%',
                aspectRatio: 1,
              }}
              transition={1000}
              placeholder={{ blurhash }}
              contentFit='contain'
            />
          </View>
          <Text style={styles.itemName}>{item.name}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  BoxContainer:{
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: hp(2),
    padding: hp(1.5),
    borderRadius: hp(3),
    width: hp(20),
  },
  ImageContainer: {
    width: hp(10),
    height: hp(10),
    backgroundColor: "rgba(128, 137, 255, 0.2)",
    borderRadius: hp(3),
    marginBottom: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }
})