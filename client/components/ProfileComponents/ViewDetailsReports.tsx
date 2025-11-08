import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import DetailsView from "./DetailsReportComponents/DetailsView";
import UserReports from "./DetailsReportComponents/UserReports";

const { width } = Dimensions.get("window");

export default function ViewDetailsReports() {
  const [activeTab, setActiveTab] = useState("view-details");
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const _tabSelectItem = [
    { title: "view details", key: "view-details" },
    { title: "reports", key: "reports" },
  ];

  const handleTabPress = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveTab(pageIndex === 0 ? "view-details" : "reports");
  };

  // Interpolate the animated underline position
  const indicatorTranslateX = scrollX.interpolate({
    inputRange: [0, width],
    outputRange: [0, width / 2], // since we have 2 tabs
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabSelectContainer}>
        {_tabSelectItem.map((item, index) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabSelectBox}
              onPress={() => handleTabPress(index)}
            >
              <Text
                style={[
                  styles.tabSelectText,
                  isActive && styles.activeTextSelectTabs,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* Animated underline */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />
      </View>

      {/* Swipeable content */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleScrollEnd}
        style={{ flex: 1 }}
      >
        <View style={{ width }}>
          <DetailsView />
        </View>
        <View style={{ width }}>
          <UserReports />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFCFC",
    width: "100%",
  },
  tabSelectContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: hp(6),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    position: "relative",
  },
  tabSelectBox: {
    width: "50%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  tabSelectText: {
    color: "#555",
    textTransform: "capitalize",
    fontWeight: "500",
    fontSize: hp(1.7),
  },
  activeTextSelectTabs: {
    color: "#8089ff",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    width: "50%", // underline width = one tab width
    backgroundColor: "#8089ff",
  },
});
