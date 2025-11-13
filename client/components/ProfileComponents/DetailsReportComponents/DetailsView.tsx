import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import GemIcon from "@/assets/Svgs/gem.svg"
import EmergencyIcon from "@/assets/Svgs/cross.svg"
import StethoscopeIcon from "@/assets/Svgs/stethoscope.svg"
import CalenderIcon from "@/assets/Svgs/calendar-days.svg"
import ClockIcon from "@/assets/Svgs/clock.svg";
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { Image } from 'expo-image'
import AvatarImg from "@/assets/images/avatar.png";
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash'
import { User } from '@/types/auth'

const blurhash = BLUR_HASH_PLACEHOLDER

interface DetailsViewProps {
  user: User | null;
}

export default function DetailsView({ user }: DetailsViewProps) {
  const location = user?.profile?.location;

  const addressDetail = location
    ? [location.city, location.state, location.country]
        .filter(Boolean)       // remove undefined / null / ""
        .join(", ")
    : null;


  // ✅ Step 1: Define the data structure
  const sections = [
    {
      title: "personal information",
      icon: GemIcon,
      data: [
        { label: "Address", value: user?.profile?.location ? addressDetail : null },
        { label: "Blood Group", value: user?.profile?.bloodGroup ? user?.profile?.bloodGroup : null },
        { label: "Phone no", value: user?.phoneNumber ? user?.phoneNumber : "+--------" },
      ],
    },
    {
      title: "emergency contact",
      icon: EmergencyIcon,
      data: [
        { label: "Name", value: user?.emergencyContact?.name ? user?.emergencyContact?.name : "!" },
        { label: "Relationship", value: user?.emergencyContact?.relationship ? user?.emergencyContact?.relationship : "!" },
        { label: "Phone no", value: user?.emergencyContact?.phoneNumber ? user?.emergencyContact?.phoneNumber : "!" },
      ],
    },
  ]

  const subBoxContentDisplay = [
    {
        icon: CalenderIcon,
        text: "sunday, 2nd March 2026"
    },
    {
        icon: ClockIcon,
        text: "08.00"
    },
  ]

  // ✅ Step 2: Render dynamically
  return (
    <View style={styles.container}>

      {sections.map((section, sectionIndex) => {
        const Icon = section.icon;
        return (
            <View key={sectionIndex} style={styles.content}>
                <View style={styles.HeaderTitle}>
                  <View style={styles.iconBox}>
                    {Icon && (
                        <Icon width={hp(2)} height={hp(2)} color="#8089ff" />
                    )}
                   </View>
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
        )
      })}

      <View style={[styles.content, { marginTop: hp(3) }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={styles.HeaderTitle}>
                <View style={styles.iconBox}>
                  <StethoscopeIcon width={hp(2.2)} height={hp(2.2)}  color="#8089ff" />
                </View>
                <Text style={styles.headerTitleText}>Passed Appointments</Text>
            </View>

            <TouchableOpacity>
                <Text style={styles.displayContentText}>View All</Text>
            </TouchableOpacity>
          </View>
          {/*  */}
          <View style={styles.boxContent}>
            {/*  */}
            <View style={styles.boxDetailsDisplay}>
                <Image
                   placeholder={blurhash}
                   source={AvatarImg}
                   style={styles.avatarImg}
                />
                <View style={{}}>
                    <Text style={styles.nameText}>Dr. Inara Isani</Text>
                    <Text style={styles.problemSolve}>heart Surgeon, Delhi</Text>
                </View>
            </View>
            {/*  */}
            <View style={styles.subBoxContent}>
                {subBoxContentDisplay.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <View key={index} style={styles.subBoxDisplay}>
                            {Icon && (
                                <Icon width={hp(2)} height={hp(2)} color="#8089ff" />
                            )}
                            <Text style={styles.subBoxDisplayText}>{item.text}</Text>
                        </View>
                    )
                })}
            </View>
          </View>
      </View>
    </View>
  )
}

// ✅ Step 3: Keep your styles
const styles = StyleSheet.create({
  container: {
    padding: hp(2)
  },
  content: {
    width: "100%",
    paddingTop: hp(2),
  },
  HeaderTitle: {
    flexDirection: "row",
    alignItems: 'center',
    gap: hp(0.5),
  },
  headerTitleText: {
    fontSize: hp(1.8),
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
  },
  downContent: {
    marginTop: hp(2),
    width: "100%",
  },
  flexContent: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: "space-between",
    marginBottom: hp(0.8),
  },
  subContent: {
    fontSize: hp(1.6),
    color: "#999",
    fontWeight: "600",
  },
  displayContentText: {
    fontSize: hp(1.6),
    color: "rgba(128, 137, 255, 0.8)",
    fontWeight: "600",
  },
  boxContent: {
    marginTop: hp(2),
    width: "100%",
    backgroundColor: "#fff",
    padding: hp(1),
    borderRadius: hp(1)
  },
  subBoxContent: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: hp(1)
  },
  subBoxDisplay: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(0.4),
    backgroundColor: "rgba(128, 137, 255, 0.1)",
    padding: hp(0.5),
    borderRadius: hp(0.4)
  },
  subBoxDisplayText: {
    color: "#8089ff",
    fontSize: hp(1.5),
  },
  boxDetailsDisplay: {
    flexDirection: "row",
    marginBottom: hp(1),
    gap: hp(1.5),
    alignItems: "flex-start",
    justifyContent: "flex-start"
  },
  avatarImg: {
    width: hp(6),
    aspectRatio: 1,
    borderRadius: hp(1.1)
  },
  nameText: {
    fontSize:  hp(2),
    fontWeight: "600",
    color: "#444"
  },
  problemSolve: {
    fontSize:  hp(1.5),
    fontWeight: "500",
    color: "#999"
  },
  iconBox: {
    backgroundColor: "rgba(128, 137, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: hp(0.4),
    width: hp(3.2),
    aspectRatio: 1
  },
})
