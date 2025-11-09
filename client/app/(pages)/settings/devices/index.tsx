import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DevicesPage() {
  const devices = [
    { id: 1, name: "Samsung Galaxy S21", type: "Mobile", lastActive: "Today, 10:45 AM" },
    { id: 2, name: "MacBook Pro 16”", type: "Laptop", lastActive: "Yesterday, 8:20 PM" },
    { id: 3, name: "iPad Air", type: "Tablet", lastActive: "3 days ago" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <GeneralSettingsHeader
        title="Connected Devices"
        returnBtn={() => router.back()}
      />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {devices.map(device => (
          <View style={styles.deviceCard} key={device.id}>
            <View style={styles.deviceInfo}>
              <Ionicons 
                name={
                  device.type === "Mobile" ? "phone-portrait-outline" : 
                  device.type === "Laptop" ? "laptop-outline" : "tablet-landscape-outline"
                } 
                size={hp(3.5)} 
                color="#6e6e6e" 
              />
              <View style={styles.textContainer}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceLastActive}>{device.lastActive}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  scrollContainer: {
    padding: hp(2),
  },
  deviceCard: {
    backgroundColor: "#fff",
    borderRadius: hp(2),
    padding: hp(2),
    marginBottom: hp(2),
    shadowColor: "#eee",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
    elevation: 3,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.5),
  },
  textContainer: {
    marginLeft: hp(1.5),
  },
  deviceName: {
    fontSize: hp(2.1),
    fontWeight: "600",
    color: "#222",
  },
  deviceLastActive: {
    fontSize: hp(1.6),
    color: "#999",
    marginTop: hp(0.3),
  },
  logoutBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#e74c3c",
    paddingVertical: hp(0.8),
    paddingHorizontal: hp(2),
    borderRadius: hp(1.5),
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: hp(1.7),
  },
});
