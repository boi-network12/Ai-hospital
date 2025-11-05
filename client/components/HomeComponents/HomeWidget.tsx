import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'
import Accessibility from "@/assets/Svgs/accessibility.svg"
import Cloud from "@/assets/Svgs/cloud.svg"
import Water from "@/assets/Svgs/glass-water.svg"
import Bed from "@/assets/Svgs/bed.svg"

export default function HomeWidget() {
  return (
    <View style={[styles.HomeWidgetContainer]}>
      {/* Steps */}
      <View style={styles.widgetContainer}>
        <View style={styles.svgContainer}>
          <Accessibility width={hp(4)} height={hp(3.5)} color="#8089ff" />
        </View>
        <Text style={styles.widgetText}>Steps</Text>
        <Text style={styles.placeholderValue}>3,482</Text>
        <Text style={styles.placeholderSubtext}>Today’s Count</Text>
      </View>

      {/* Weather */}
      <View style={styles.widgetContainer}>
        <View style={styles.svgContainer}>
          <Cloud width={hp(4)} height={hp(3.5)} color="#8089ff" />
        </View>
        <Text style={styles.widgetText}>Weather</Text>
        <Text style={styles.placeholderValue}>27°C</Text>
        <Text style={styles.placeholderSubtext}>Partly Cloudy</Text>
      </View>

      {/* Hydration */}
      <View style={styles.widgetContainer}>
        <View style={styles.svgContainer}>
          <Water width={hp(4)} height={hp(3.5)} color="#8089ff" />
        </View>
        <Text style={styles.widgetText}>Hydration</Text>
        <Text style={styles.placeholderValue}>1.2 L</Text>
        <Text style={styles.placeholderSubtext}>of 2.5 L goal</Text>
      </View>

      {/* Bedtime */}
      <View style={styles.widgetContainer}>
        <View style={styles.svgContainer}>
          <Bed width={hp(4)} height={hp(3.5)} color="#8089ff" />
        </View>
        <Text style={styles.widgetText}>Bedtime</Text>
        <Text style={styles.placeholderValue}>11:45 PM</Text>
        <Text style={styles.placeholderSubtext}>Set Alarm</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  HomeWidgetContainer: {
    marginTop: hp(3),
    marginBottom: hp(2),
    width: "100%",
    flexWrap: "wrap",
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: hp(2),
    flexDirection: "row"
  },
  widgetContainer: {
    backgroundColor: "#fff",
    width: hp(20),
    borderWidth: 0.5,
    borderColor: "#eee",
    height: hp(20),
    borderRadius: hp(1),
    padding: hp(1.5),
    alignItems: "flex-start",
    justifyContent: "flex-start"
  },
  svgContainer: {
    backgroundColor: "rgba(128, 137, 255, 0.08)",
    width: hp(6),
    aspectRatio: 1,
    borderRadius: hp(3),
    alignItems: 'center',
    justifyContent: 'center'
  },
  widgetText: {
    fontFamily: "Roboto-bold",
    marginTop: hp(1.6),
    fontWeight: "600",
    fontSize: hp(1.8),
    color: "#333"
  },
  placeholderValue: {
    fontSize: hp(2.6),
    fontWeight: "700",
    color: "#8089ff",
    marginTop: hp(0.8)
  },
  placeholderSubtext: {
    fontSize: hp(1.5),
    color: "#888",
    marginTop: hp(0.3)
  }
})
