import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import React, {  } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import EmailIcon from "@/assets/Svgs/mail.svg";

/* ----------------------------------------------------------------- */
/* Separate form component – keeps the screen file tidy                */
/* ----------------------------------------------------------------- */
interface FormProps  {
  currentEmail: string;
  newEmail: string;
  setNewEmail: (v: string) => void;
  confirmEmail: string;
  setConfirmEmail: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
};

export default function EmailChangeForm({
  currentEmail,
  newEmail,
  setNewEmail,
  confirmEmail,
  setConfirmEmail,
  onSubmit,
  isSubmitting,
  error,
}: FormProps) {
  

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <EmailIcon width={hp(3)} height={hp(3)} color="#8089FF" />
        </View>
        <Text style={styles.headerTitle}>Change Your Email</Text>
        <Text style={styles.headerSubtitle}>
          Keep your account secure by keeping your email address up to date.
        </Text>
      </View>

      {/* Input form */}
      <View style={styles.formCard}>
        <Text style={styles.label}>Current Email</Text>
        <TextInput
          style={[styles.input, styles.readonly]}
          value={currentEmail}
          editable={false}
        />

        <Text style={styles.label}>New Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your new email"
          placeholderTextColor="#aaa"
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Confirm New Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter your new email"
          placeholderTextColor="#aaa"
          value={confirmEmail}
          onChangeText={setConfirmEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Error message */}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Save Button */}
        <TouchableOpacity
          onPress={onSubmit}
          disabled={isSubmitting}
          style={{ borderRadius: hp(10), overflow: "hidden" }} // ensures gradient stays clipped
        >
          <LinearGradient
            colors={["#8089FF", "#A174FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtn}
          >
            <View style={styles.btnInner}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

      </View>

      {/* Info Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteTitle}>Note:</Text>
        <Text style={styles.noteText}>
          A verification link will be sent to your new email address. Please verify it to
          complete the change.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: hp(2),
    flexDirection: "column",
    gap: hp(2),
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(5),
  },
  iconCircle: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(4),
    backgroundColor: "rgba(128,137,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(1),
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontWeight: "700",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: hp(1.7),
    color: "#777",
    textAlign: "center",
    marginTop: hp(0.8),
    lineHeight: hp(2.2),
  },
  formCard: {
    backgroundColor: "#fff",
    padding: hp(2),
    borderRadius: hp(2),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: hp(1.6),
    color: "#555",
    fontWeight: "500",
    marginBottom: hp(0.5),
    marginTop: hp(1),
  },
  input: {
    height: hp(5.5),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: hp(1),
    paddingHorizontal: wp(3),
    color: "#333",
    fontSize: hp(1.8),
  },
   readonly: {
    backgroundColor: '#f5f5f5',
    color: '#777',
  },

  error: {
    marginTop: hp(1),
    color: '#d32f2f',
    fontSize: hp(1.6),
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: hp(3),
    borderRadius: hp(10),
    height: hp(6),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8089FF",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  btnInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveText: {
    fontSize: hp(2),
    color: "#fff",
    fontWeight: "700",
  },
  noteContainer: {
    backgroundColor: "rgba(128,137,255,0.08)",
    padding: hp(2),
    borderRadius: hp(2),
  },
  noteTitle: {
    fontSize: hp(1.7),
    fontWeight: "600",
    color: "#555",
  },
  noteText: {
    fontSize: hp(1.6),
    color: "#666",
    marginTop: hp(0.5),
    lineHeight: hp(2.1),
  },
});
