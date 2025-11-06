import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import { router } from 'expo-router'

export default function CalenderHeader() {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        {/* <BackIcon width={hp(3)} height={hp(3)} color="#333" /> */}
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Appointments</Text>
      <View style={{ width: hp(3) }} />
    </View>
  )
}

const styles = StyleSheet.create({
    header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hp(2),
    height: hp(6.5),
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontFamily: 'Roboto-Bold',
    fontSize: hp(2),
    color: '#555',
  },
})