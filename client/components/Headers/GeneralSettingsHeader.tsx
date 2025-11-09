import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import BackArrow from "@/assets/Svgs/arrow-left.svg";

interface GeneralSettingsHeaderProps {
    title: string | null;
    returnBtn: () => void;
}

export default function GeneralSettingsHeader({ 
    title, 
    returnBtn
 }: GeneralSettingsHeaderProps) {

  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={returnBtn}>
            <BackArrow width={hp(2.5)} height={hp(2.5)} color="#444" />
        </TouchableOpacity>
      <Text style={styles.headerText}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: hp(6),
        borderBottomWidth: 0.5,
        borderBottomColor: "#eee",
        alignItems: 'center',
        justifyContent: "flex-start",
        flexDirection: "row",
        paddingHorizontal: hp(2)
    },
    headerText: {
        marginLeft: hp(1.5),
        fontSize: hp(2),
        fontWeight: "500",
        color: "#444"
    }
})