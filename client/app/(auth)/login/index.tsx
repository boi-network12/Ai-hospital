import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginHeaderComponent from "@/components/Headers/LoginHeaderComponent";
import { useRouter } from "expo-router";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useAuth } from "@/Hooks/authHook.d";
import { Modalize } from "react-native-modalize";
import { Portal } from "react-native-portalize";
import { Ionicons, Feather } from "@expo/vector-icons";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const modalizeRef = useRef<Modalize>(null);

  const openForgetPassword = useCallback(() => {
    modalizeRef.current?.open();
  }, []);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);


  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || "Login failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = () => {
    passwordRef.current?.focus();
  };

  if (error) {
    setTimeout(() => setError(""), 3000);
  }

  /* ------------------------------ RESET MODAL ------------------------------ */
  const ResetPasswordModal = () => {
    const { requestResetOtp, resetPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState<"email" | "otp" | "password">("email");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSendOtp = async () => {
      if (!email.includes("@")) {
        setError("Enter a valid email");
        return;
      }
      setLoading(true);
      setError("");

      try {
        await requestResetOtp({ email });
        setStep("otp");
      } catch  {
        setError("Failed to send code");
      } finally {
        setLoading(false);
      }
    };

    const handleVerifyOtp = () => {
      if (otp.length !== 6) {
        setError("Enter the 6-digit code");
        return;
      }
      setStep("password");
    };

    const handleResetPassword = async () => {
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setLoading(true);
      setError("");

      try {
        await resetPassword({ email, otp, newPassword });
        setSuccess(true);

        setTimeout(() => {
          modalizeRef.current?.close();
          setStep("email");
          setEmail("");
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setSuccess(false);
        }, 1800);
      } catch (e: any) {
        setError(e.message || "Failed to reset");
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>
          {step === "email" && "Reset Password"}
          {step === "otp" && "Enter Code"}
          {step === "password" && "Set New Password"}
        </Text>

        {success ? (
          <View style={styles.successContainer}>
            <Feather name="check-circle" size={hp(4)} color="#22c55e" />
            <Text style={styles.successText}>Password reset successfully</Text>
          </View>
        ) : (
          <>
            {/* EMAIL INPUT */}
            {step === "email" && (
              <>
                <Text style={styles.modalSubtitle}>
                  Enter your email address to receive a reset code
                </Text>

                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={20} color="#6b7280" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="you@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionBtnText}>Send Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* OTP INPUT */}
            {step === "otp" && (
              <>
                <Text style={styles.modalSubtitle}>
                  A 6-digit code has been sent to:
                </Text>
                <Text style={styles.emailDisplay}>{email}</Text>

                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="#aaa"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />

                <TouchableOpacity style={styles.actionBtn} onPress={handleVerifyOtp}>
                  <Text style={styles.actionBtnText}>Continue</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep("email")}>
                  <Text style={styles.backText}>Change email</Text>
                </TouchableOpacity>
              </>
            )}

            {/* NEW PASSWORD */}
            {step === "password" && (
              <>
                <Text style={styles.modalSubtitle}>
                  Choose a secure new password
                </Text>

                {/* NEW PASSWORD INPUT */}
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={20} color="#6b7280" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="New password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>

                {/* CONFIRM PASSWORD */}
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={20} color="#6b7280" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Confirm password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionBtnText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </>
        )}
      </View>
    );
  };

  /* ------------------------------ UI ------------------------------ */

  return (
    <SafeAreaView style={styles.safeArea}>
      <LoginHeaderComponent returnBack={() => router.back()} title="Login" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color="#6b7280" />
              <TextInput
                ref={emailRef}
                style={styles.inputField}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={handleEmailSubmit}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#6b7280" />

              <TextInput
                ref={passwordRef}
                style={styles.inputField}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity onPress={openForgetPassword} style={styles.forgotLink}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Sign-up link */}
            <View style={styles.signupWrapper}>
              <Text style={styles.signupPrompt}>Don’t have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* RESET PASSWORD MODAL */}
        <Portal>
          <Modalize
            ref={modalizeRef}
            modalHeight={hp(72)}
            handlePosition="inside"
            withOverlay
            overlayStyle={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            modalStyle={styles.modal}
          >
            <ResetPasswordModal />
          </Modalize>
        </Portal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------------ STYLES ------------------------------ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: hp(3),
    paddingTop: hp(4),
  },

  form: {
    width: "100%",
    marginTop: hp(2),
  },

  label: {
    fontSize: hp(1.9),
    color: "#374151",
    marginBottom: hp(0.8),
    fontWeight: "600",
  },

  /* Modern input container */
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: hp(1.2),
    paddingHorizontal: hp(1.8),
    paddingVertical: hp(0.5),
    backgroundColor: "#FAFAFA",
    marginBottom: hp(2),
  },

  inputField: {
    flex: 1,
    paddingLeft: hp(1.4),
    fontSize: hp(2),
    color: "#111827",
  },

  forgotLink: {
    alignSelf: "flex-end",
    marginTop: -hp(1),
    marginBottom: hp(3),
  },

  forgotText: {
    color: "#6366F1",
    fontWeight: "500",
    fontSize: hp(1.5),
  },

  loginBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: hp(1.5),
    borderRadius: hp(1.2),
    alignItems: "center",
    marginBottom: hp(3),
  },

  loginBtnText: {
    color: "#fff",
    fontSize: hp(2.1),
    fontWeight: "600",
  },

  signupWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: hp(1),
  },

  signupPrompt: {
    color: "#6b7280",
    fontSize: hp(1.8),
  },

  signupLink: {
    color: "#6366F1",
    fontSize: hp(1.8),
    fontWeight: "500",
  },

  /* Error */
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: hp(1.5),
    borderRadius: hp(1),
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginBottom: hp(2),
  },
  errorText: {
    color: "#B91C1C",
    fontSize: hp(1.8),
    textAlign: "center",
  },

  /* MODAL */
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: hp(2),
    borderTopRightRadius: hp(2),
    paddingBottom: hp(3),
  },

  modalContent: {
    paddingHorizontal: hp(3),
    paddingTop: hp(2.5),
  },

  modalTitle: {
    fontSize: hp(3),
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
    marginBottom: hp(1.5),
  },

  modalSubtitle: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: hp(1.9),
    marginBottom: hp(3),
    lineHeight: hp(2.8),
  },

  emailDisplay: {
    fontSize: hp(2),
    fontWeight: "600",
    color: "#6366F1",
    textAlign: "center",
    marginBottom: hp(2),
  },

  otpInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: hp(1.7),
    fontSize: hp(3),
    textAlign: "center",
    borderRadius: hp(1.2),
    letterSpacing: hp(1),
    backgroundColor: "#FAFAFA",
    marginBottom: hp(3),
  },

  actionBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: hp(1.7),
    borderRadius: hp(1.2),
    alignItems: "center",
    marginTop: hp(1),
  },

  actionBtnText: {
    color: "#fff",
    fontSize: hp(2),
    fontWeight: "600",
  },

  backText: {
    color: "#6366F1",
    textAlign: "center",
    marginTop: hp(2),
    fontSize: hp(1.8),
  },

  successContainer: {
    alignItems: "center",
    paddingVertical: hp(3),
  },

  successText: {
    marginTop: hp(1),
    color: "#22c55e",
    fontSize: hp(2.2),
    fontWeight: "600",
    textAlign: "center",
  },
});
