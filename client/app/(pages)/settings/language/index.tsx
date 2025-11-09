import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { SafeAreaView } from 'react-native-safe-area-context';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Language() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');

  const languages = ['English', 'French', 'Spanish', 'German', 'Chinese', 'Arabic'];

  return (
    <SafeAreaView style={styles.ProfileDetailsContainer}>
      <GeneralSettingsHeader 
         title="Languages"
         returnBtn={() => router.back()}
      />

      <ScrollView
        bounces
        contentContainerStyle={styles.ScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionContainer}>
          {languages.map((lang, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.languageRow,
                selectedLanguage === lang && styles.languageRowSelected
              ]}
              onPress={() => setSelectedLanguage(lang)}
              activeOpacity={0.7}
            >
              <Text style={styles.languageText}>{lang}</Text>
              {selectedLanguage === lang && (
                <Ionicons name="checkmark" size={hp(2.5)} color="#8089FF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  ProfileDetailsContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  ScrollContainer: {
    backgroundColor: "#fcfcfc",
    paddingHorizontal: hp(2),
    paddingVertical: hp(2),
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: hp(2),
    paddingVertical: hp(1),
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#eee",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  languageRowSelected: {
    backgroundColor: "rgba(128, 137, 255, 0.05)",
  },
  languageText: {
    fontSize: hp(1.8),
    color: "#333",
    fontWeight: "500",
  },
});
