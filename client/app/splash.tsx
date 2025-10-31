import { StyleSheet, ActivityIndicator } from 'react-native'
import React, { JSX } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Splash(): JSX.Element | null {
  return (
    <SafeAreaView style={styles.wrapper}>
      <ActivityIndicator size="small" color="#fff" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8089ff',
    }
})