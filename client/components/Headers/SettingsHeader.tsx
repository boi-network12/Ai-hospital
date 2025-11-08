import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import BackArrow from "@/assets/Svgs/arrow-left.svg";

interface SettingsHeaderProps {
    returnBtn: () => void;
}

export default function SettingsHeader({ returnBtn }: SettingsHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={returnBtn}>
        <BackArrow width={hp(3)} height={hp(3)} color="#333"  />
      </TouchableOpacity>
      <Text style={styles.text}>settings</Text>
      <View></View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 0.5,
        borderBottomColor: "#eee",
        paddingHorizontal: hp(2),
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: "space-between",
        height: hp(6)
    },
    text: {
        fontWeight: "500",
        fontSize: hp(2),
        textTransform: 'capitalize'
    }
})