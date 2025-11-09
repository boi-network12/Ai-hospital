import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";

export default function OtherDetailsDisplay() {
  const sections = [
    {
      title: "personal information",
      data: [
        { label: "Phone no", value: "+234 9075134655" },
        { label: "Address", value: "29, mbaUkwu street" },
        { label: "Blood Group", value: "B+" },
        { label: "Genotype", value: "AB+" },
        { label: "Height", value: "12" },
        { label: "Weight", value: "105" },
      ],
    },
    {
      title: "emergency contact",
      data: [
        { label: "Name", value: "Amara Okolo" },
        { label: "Relationship", value: "Sister" },
        { label: "Phone no", value: "+234 8012345678" },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.content}>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>{section.title}</Text>
          </View>

          <View style={styles.downContent}>
            {section.data.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.flexContent}>
                <Text style={styles.subContent}>{item.label}</Text>
                <Text style={styles.displayContentText}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* 🔥 Subscribe Banner */}
      <LinearGradient
        colors={["#8089FF", "#A174FF", "#FF9CF9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.subscribeBanner}
      >
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Upgrade Your Experience 🚀</Text>
          <Text style={styles.bannerSubtitle}>
            Subscribe now to unlock premium health tracking and insights!
          </Text>
        </View>

        <TouchableOpacity style={styles.subscribeBtn}>
          <Text style={styles.subscribeText}>Subscribe</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* 🧨 Delete Account Button */}
      <TouchableOpacity style={styles.deleteBtn}>
        <Text style={styles.btnText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginTop: hp(2),
    padding: hp(2),
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: hp(3),
    flexDirection: "column",
    shadowColor: "#eee",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  content: {
    width: "100%",
    marginBottom: hp(2),
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: hp(0.8),
    marginBottom: hp(0.6),
  },
  headerTitleText: {
    fontSize: hp(2),
    fontWeight: "700",
    color: "#444",
    textTransform: "capitalize",
  },
  downContent: {
    width: "100%",
    backgroundColor: "#F9F9FF",
    borderRadius: hp(1.5),
    padding: hp(1.5),
  },
  flexContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(1),
  },
  subContent: {
    fontSize: hp(1.6),
    color: "#777",
    fontWeight: "400",
  },
  displayContentText: {
    fontSize: hp(1.7),
    color: "#8089FF",
    fontWeight: "600",
  },

  // 🔥 Subscribe Banner Styles
  subscribeBanner: {
    borderRadius: hp(2),
    padding: hp(2),
    marginTop: hp(2),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#8089FF",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: wp(2),
  },
  bannerTitle: {
    fontSize: hp(2.1),
    fontWeight: "700",
    color: "#fff",
  },
  bannerSubtitle: {
    fontSize: hp(1.6),
    color: "#f0f0f0",
    marginTop: hp(0.5),
    lineHeight: hp(2.2),
  },
  subscribeBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: hp(10),
  },
  subscribeText: {
    color: "#8089FF",
    fontWeight: "700",
    fontSize: hp(1.7),
  },

  deleteBtn: {
    backgroundColor: "#F26565",
    marginTop: hp(3),
    height: hp(5.5),
    borderRadius: hp(10),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F26565",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  btnText: {
    fontSize: hp(1.9),
    color: "#fff",
    fontWeight: "600",
  },
});
