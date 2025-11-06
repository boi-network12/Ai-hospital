import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'
import FilterIcon from "@/assets/Svgs/funnel.svg"
import LocationIcon from "@/assets/Svgs/locate.svg"

interface DiscoveryHeaderProps {
    onFIlterPress?: () => void
}

export default function DiscoveryHeader({ onFIlterPress }: DiscoveryHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.targetStyle}>
        <Text style={styles.targetStyleText}>lagos, nigeria</Text>
        <LocationIcon width={hp(2.2)} height={hp(2.2)} color="#8089ff" />
      </View>

      {/*  */}
      <TouchableOpacity onPress={onFIlterPress} activeOpacity={0.6}>
         <FilterIcon width={hp(2.2)} height={hp(2.2)} color="#8089ff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 0.3,
        borderBottomColor: "#eee",
        height: hp(7),
        paddingHorizontal: hp(2),
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row"
    },
    targetStyle: {
        flexDirection: "row",
        alignItems: 'center',
        gap: hp(1),
        justifyContent: "flex-start"
    },
    targetStyleText: {
        fontSize: hp(1.7),
        textTransform: "capitalize"
    }
})