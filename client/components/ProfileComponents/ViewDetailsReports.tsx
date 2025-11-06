import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { heightPercentageToDP as hp  } from 'react-native-responsive-screen'
import { PanGestureHandler } from 'react-native-gesture-handler'
import DetailsView from './DetailsReportComponents/DetailsView';
import UserReports from './DetailsReportComponents/UserReports';



export default function ViewDetailsReports() {
    const [activeTab, setActiveTab] = useState("view-details");

    const _tabSelectItem = [
        {
            title: "view Details",
            active: true,
            key: "view-details" 
        },
        {
            title: "reports",
            active: false,
            key: "reports"
        }
    ]

    const handleSwipe = (event: any) => {
        const { translationX } = event.nativeEvent
        // swipe left → go to reports
        if (translationX < -50 && activeTab === "view-details") {
           setActiveTab("reports")
        }
        // swipe right → go to details
        if (translationX > 50 && activeTab === "reports") {
           setActiveTab("view-details")
        }
    }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabSelectContainer}>
        {_tabSelectItem.map((item) => {
          const isActive = activeTab === item.key
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setActiveTab(item.key)}
              style={[styles.tabSelectBox, isActive && styles.activeTabSelect]}
            >
              <Text style={[styles.tabSelectText, isActive && styles.activeTextSelectTabs]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Swipeable content */}
      <PanGestureHandler onGestureEvent={handleSwipe}>
        <View style={{ padding: hp(1.5), flex: 1 }}>
          {activeTab === "view-details" && <DetailsView />}
          {activeTab === "reports" && <UserReports />}
        </View>
      </PanGestureHandler>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: "#F8F8F8FF",
        width: "100%"
    },
    tabSelectContainer: {
        flexDirection: "row",
        justifyContent: 'space-around',
        alignItems: 'center',
        height: hp(6),
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    },
    tabSelectBox: {
        // backgroundColor: "#000",
        width: "50%",
        height: "100%",
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTabSelect: {
        borderBottomWidth: 2,
        borderBottomColor: "#8089ff"
    },
    tabSelectText: {
        color: "#555",
        textTransform: 'capitalize',
        fontWeight: "500",
        fontSize: hp(1.7)
    },
    activeTextSelectTabs: {
        color: "#8089ff"
    }
})