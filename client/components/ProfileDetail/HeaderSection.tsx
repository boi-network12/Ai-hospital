import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { Image } from 'expo-image'
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import ProfileAvatar from "@/assets/images/avatar.png";

const blurhash = BLUR_HASH_PLACEHOLDER;

export default function HeaderSection() {

    const _AuxDetails = ["19 yrs", "Aquarius", "Male"]

  return (
    <View style={styles.container}>
      <View style={styles.topSideSection}>
        <View style={styles.imageContainer}>
            <Image
                source={ProfileAvatar}
                placeholder={blurhash}
                style={{
                    width: "100%",
                    aspectRatio: 1,
                    objectFit: "contain",
                    borderRadius: 100,
                }}
            />
        </View>
        <View style={{ marginTop: hp(1.5) }}>
            <Text style={styles.textDetails}>jane</Text>
            <Text style={styles.textDetails}>Kamdilichukwu2020@gmail.com</Text>
            <View style={{
                flexDirection: "row",
                gap: hp(1),
                marginTop: hp(1)
            }}>
                {_AuxDetails.map((item, index) => (
                    <Text key={index} style={styles.mapText}>{item}</Text>
                ))}
            </View>
        </View>
      </View>
      {/*  */}
      <TouchableOpacity style={styles.BtnContainer}>
        <Text style={styles.btnText}>edit profile</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        marginTop: hp(2),
        padding: hp(2),
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: hp(3.5),
        flexDirection: "column",
    },
    topSideSection: {
        flexDirection: "row",
        marginBottom: hp(3),
        gap: hp(2),
        justifyContent: "flex-start",
        alignItems: "flex-start"
    },
    imageContainer: {
        width: wp(20),
        borderRadius: hp(15)
    },
    textDetails: {
        fontSize: hp(1.6),
        fontWeight: "400",
        color: "#444",
    },
    mapText: {
        color: "#8089FF",
        backgroundColor: "rgba(128, 137, 255, 0.15)",
        paddingVertical: hp(0.5),
        paddingHorizontal: hp(0.8),
        borderRadius: hp(0.8),
        fontSize: hp(1.5)
    },
    BtnContainer: {
        backgroundColor: "#8089FF",
        height: hp(5),
        borderRadius: hp(10),
        alignItems: "center",
        justifyContent: "center",
    },
    btnText: {
        color: "#fff",
        fontWeight: "500",
        fontSize: hp(1.8),
        textTransform: 'capitalize'
    }
})