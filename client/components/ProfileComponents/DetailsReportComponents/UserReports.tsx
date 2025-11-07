import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { heightPercentageToDP as hp } from "react-native-responsive-screen"
import { SvgProps } from 'react-native-svg'

// SVG imports
import StethoscopeIcon from "@/assets/Svgs/stethoscope.svg"
import EmergencyIcon from "@/assets/Svgs/cross.svg"
import FileIcon from "@/assets/Svgs/file-text.svg"

// 🧩 Types
interface ReportItem {
  icon: React.FC<SvgProps>
  title: string
  timeStamp: string
}

interface ReportSectionProps {
  title: string
  IconHeader: React.FC<SvgProps>
  reports: ReportItem[]
}

// 🧠 Reusable Section Component
const ReportSection: React.FC<ReportSectionProps> = ({ title, IconHeader, reports }) => {
  return (
    <View style={styles.UserReportContent}>
      {/* Header */}
      <View style={styles.HeaderDisplay}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <IconHeader width={hp(2.2)} height={hp(2.2)} color="#8089ff" />
          </View>
          <Text style={styles.headerText}>{title}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.uploadBtn}>upload report</Text>
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      <View style={styles.reportsContent}>
        {reports.map((item, index) => {
          const Icon = item.icon
          return (
            <View key={index} style={styles.reportsBox}>
              <View style={[styles.iconBox, { width: hp(4) }]}>
                <Icon width={hp(2.8)} height={hp(2.8)} color="#8089ff" />
              </View>
              <View style={styles.DocDetails}>
                <Text style={styles.nameDetails}>{item.title}</Text>
                <Text style={styles.subDetails}>{item.timeStamp}</Text>
              </View>
            </View>
          )
        })}
        <TouchableOpacity>
          <Text style={styles.uploadBtn}>View All</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// 🧾 Main Component
const UserReports: React.FC = () => {
  const reportsData: ReportItem[] = [
    {
      icon: FileIcon,
      title: "Dr. Inara Isani Prescription",
      timeStamp: "Sunday 2nd March 2026",
    },
    {
      icon: FileIcon,
      title: "Dr. Inara Isani Prescription",
      timeStamp: "Sunday 2nd March 2026",
    },
  ]

  const reportSections = [
    {
      title: "doctor prescriptions",
      IconHeader: StethoscopeIcon,
      reports: reportsData,
    },
    {
      title: "lab reports",
      IconHeader: EmergencyIcon,
      reports: reportsData,
    },
  ]

  return (
    <View style={styles.UserReportsContainer}>
      {reportSections.map((section, index) => (
        <ReportSection
          key={index}
          title={section.title}
          IconHeader={section.IconHeader}
          reports={section.reports}
        />
      ))}
    </View>
  )
}

export default UserReports

// 🎨 Styles
const styles = StyleSheet.create({
  UserReportsContainer: {
    flexDirection: 'column',
    gap: hp(3),
    padding: hp(2)
  },
  UserReportContent: {
    width: "100%",
    flexDirection: "column",
  },
  HeaderDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
    gap: hp(0.7),
  },
  iconBox: {
    backgroundColor: "rgba(128, 137, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: hp(0.4),
    width: hp(3.5),
    aspectRatio: 1,
  },
  headerText: {
    fontSize: hp(1.9),
    textTransform: 'capitalize',
    color: "#444",
    fontWeight: "400",
  },
  uploadBtn: {
    fontSize: hp(1.9),
    textTransform: 'capitalize',
    color: "#8089ff",
    fontWeight: "500",
  },
  reportsContent: {
    marginTop: hp(2),
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
    gap: hp(1),
  },
  reportsBox: {
    width: "100%",
    backgroundColor: '#ffffff',
    borderRadius: hp(1.5),
    padding: hp(1.5),
    flexDirection: "row",
    gap: hp(1.3),
    alignItems: "center",
    justifyContent: 'flex-start',
  },
  DocDetails: {},
  nameDetails: {
    fontSize: hp(1.7),
    color: "#333",
  },
  subDetails: {
    fontSize: hp(1.4),
    color: "#888",
  },
})
