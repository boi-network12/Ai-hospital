import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import BackIcon from "@/assets/Svgs/arrow-left.svg";
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

interface LoginHeaderComponentProps {
    returnBack: () => void;
    title: string;
}

export default function LoginHeaderComponent({ returnBack, title }: LoginHeaderComponentProps) {
  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={returnBack}>
            <BackIcon height={hp(3)} width={hp(3)} color="#333" />
        </TouchableOpacity>
      <Text>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingHorizontal: hp(2),
        alignItems: 'center',
        justifyContent: "space-between",
        flexDirection: "row",
        height: hp(5)
    }
})