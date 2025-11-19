/* app/(auth)/register.tsx */
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Feather, Ionicons } from "@expo/vector-icons";
import LoginHeaderComponent from "@/components/Headers/LoginHeaderComponent";
import { useAuth } from "@/Hooks/authHook.d";

/* -------------------- Yup schemas -------------------- */
const emailSchema = yup.object({
  email: yup.string().email("Enter a valid email").required("Email is required"),
});

const otpSchema = yup.object({
  otp: yup.string().required().length(6),
});

const registerSchema = yup.object({
  password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
  name: yup.string().required("Name is required"),
  phoneNumber: yup.string().matches(/^\d{10,15}$/, "Enter a valid phone number").required("Phone number is required"),
  gender: yup.string().oneOf(["Male", "Female", "Other", "Prefer not to say"]).required("Select gender"),
  dateOfBirth: yup.date().nullable().required("Date of birth is required"),
});

/* -------------------- Types -------------------- */
type EmailForm = yup.InferType<typeof emailSchema>;
type OtpForm = yup.InferType<typeof otpSchema>;
type RegisterForm = yup.InferType<typeof registerSchema>;

export default function RegisterPage() {
  const { requestOtp, verifyOtpAndFinishRegister } = useAuth();
  const router = useRouter();

  // UI state
  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // animation for fade (shared)
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // fade whenever step changes
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [step, fadeAnim]);

  // forms
  const emailForm = useForm<EmailForm>({ resolver: yupResolver(emailSchema), defaultValues: { email: "" } });
  const otpForm = useForm<OtpForm>({ resolver: yupResolver(otpSchema), defaultValues: { otp: "" } });
  const detailsForm = useForm<RegisterForm>({
    resolver: yupResolver(registerSchema),
    defaultValues: { password: "", name: "", phoneNumber: "", gender: "Prefer not to say", dateOfBirth: undefined as any },
  });

  // pull setValue out so effect deps are stable
  const { setValue: setOtpValue } = otpForm;

  /* -------------------- OTP box refs & logic -------------------- */
  // Six TextInput refs for OTP boxes (properly typed)
  const otpInputsRef = useRef<(RNTextInput | null)[]>([]);
  // Local OTP state for boxes (string of length up to 6)
  const [otpBoxes, setOtpBoxes] = useState<string[]>(["", "", "", "", "", ""]);

  // When otpBoxes changes, keep the otp form value in sync
  useEffect(() => {
    const combined = otpBoxes.join("");
    setOtpValue("otp", combined);
  }, [otpBoxes, setOtpValue]);

  const focusOtpBox = (index: number) => {
    otpInputsRef.current[index]?.focus();
  };

  const handleOtpChange = (text: string, index: number) => {
    if (!text) {
      const newBoxes = [...otpBoxes];
      newBoxes[index] = "";
      setOtpBoxes(newBoxes);
      return;
    }


    // If they pasted multiple digits, distribute
    if (text.length > 1) {
      const chars = text.split("");
      const newBoxes = [...otpBoxes];
      let i = index;
      for (const ch of chars) {
        if (i > 5) break;
        newBoxes[i] = ch;
        i += 1;
      }
      setOtpBoxes(newBoxes);
      focusOtpBox(Math.min(5, index + text.length));
      return;
    }

    const newBoxes = [...otpBoxes];
    newBoxes[index] = text;
    setOtpBoxes(newBoxes);

    // move forward if filled
    if (index < 5) {
      focusOtpBox(index + 1);
    }
  };

  const handleOtpKeyPress = ({ nativeEvent }: any, index: number) => {
    if (nativeEvent.key === "Backspace") {
      if (otpBoxes[index] === "" && index > 0) {
        // move to previous and clear it
        const newBoxes = [...otpBoxes];
        newBoxes[index - 1] = "";
        setOtpBoxes(newBoxes);
        focusOtpBox(index - 1);
      } else {
        // clear current
        const newBoxes = [...otpBoxes];
        newBoxes[index] = "";
        setOtpBoxes(newBoxes);
      }
    }
  };

  /* -------------------- Steps actions -------------------- */
  const onEmailSubmit = async (data: EmailForm) => {
    setIsLoading(true);
    try {
      await requestOtp({ email: data.email });
      setEmail(data.email);
      setStep("otp");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = async () => {
    const isValid = await otpForm.trigger();
    if (!isValid) return;

    // proceed to details (actual verify will be in final step)
    setIsLoading(true);
    try {
      setStep("details");
    } catch (e: any) {
      Alert.alert("Invalid OTP", e?.message || "Please check the code");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const isoDate = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined;
      await verifyOtpAndFinishRegister({
        email,
        otp: otpForm.getValues().otp,
        password: data.password,
        name: data.name,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        dateOfBirth: isoDate,
      });
      // Auth context handles login + redirect
    } catch (e: any) {
      Alert.alert("Registration failed", e?.message || "Try again");
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------- UI pieces -------------------- */

  const StepProgress = () => {
    return (
      <View style={styles.progressRow}>
        <View style={[styles.progressDot, (step === "email" || step === "otp" || step === "details") && styles.progressDotActive]} />
        <View style={[styles.progressLine, (step === "otp" || step === "details") && styles.progressLineActive]} />
        <View style={[styles.progressDot, (step === "otp" || step === "details") && styles.progressDotActive]} />
        <View style={[styles.progressLine, step === "details" && styles.progressLineActive]} />
        <View style={[styles.progressDot, step === "details" && styles.progressDotActive]} />
      </View>
    );
  };

  const renderEmailStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <StepProgress />
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Enter your email to receive a 6-digit code</Text>

      <Controller
        control={emailForm.control}
        name="email"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, fieldState.invalid && styles.inputError]}>
              <Feather name="mail" size={18} color="#6b7280" />
              <RNTextInput
                style={styles.inputField}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                editable={!isLoading}
                returnKeyType="send"
                onSubmitEditing={emailForm.handleSubmit(onEmailSubmit)}
              />
            </View>
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
          </>
        )}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={emailForm.handleSubmit(onEmailSubmit)} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Request OTP</Text>}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderOtpStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <StepProgress />
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>We sent a code to {email}</Text>

      <View style={{ marginTop: hp(1) }}>
        <Text style={styles.label}>6-digit code</Text>

        <View style={styles.otpRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <RNTextInput
              key={`otp-${i}`}
              ref={(ref) => {
                // callback must return void — do not return the ref expression
                otpInputsRef.current[i] = ref;
              }}
              value={otpBoxes[i]}
              onChangeText={(t) => handleOtpChange(t, i)}
              onKeyPress={(e) => handleOtpKeyPress(e, i)}
              keyboardType="default"
              maxLength={1}
              style={[styles.otpBox]}
              textContentType="oneTimeCode"
              returnKeyType="done"
              editable={!isLoading}
            />
          ))}
        </View>

        {/* hidden controller to keep validation — render a tiny View (type-safe) */}
        <Controller control={otpForm.control} name="otp" render={() => <View style={{ height: 0, width: 0 }} />} />

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep("email")} disabled={isLoading}>
            <Text style={styles.secondaryBtnText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={onOtpSubmit} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Next</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderDetailsStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <StepProgress />
      <Text style={styles.title}>Complete Profile</Text>

      {/* Password with eye toggle */}
      <Controller
        control={detailsForm.control}
        name="password"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, fieldState.invalid && styles.inputError]}>
              <Feather name="lock" size={18} color="#6b7280" />
              <RNTextInput
                style={styles.inputField}
                placeholder="Create a strong password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!isPasswordVisible}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible((s) => !s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
          </>
        )}
      />

      {/* Full name */}
      <Controller
        control={detailsForm.control}
        name="name"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>Full name</Text>
            <View style={[styles.inputWrapper, fieldState.invalid && styles.inputError]}>
              <Feather name="user" size={18} color="#6b7280" />
              <RNTextInput style={styles.inputField} placeholder="John Doe" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!isLoading} />
            </View>
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
          </>
        )}
      />

      {/* Phone */}
      <Controller
        control={detailsForm.control}
        name="phoneNumber"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>Phone number</Text>
            <View style={[styles.inputWrapper, fieldState.invalid && styles.inputError]}>
              <Feather name="phone" size={18} color="#6b7280" />
              <RNTextInput style={styles.inputField} placeholder="1234567890" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!isLoading} />
            </View>
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
          </>
        )}
      />

      {/* Gender — segmented control */}
      <Controller
        control={detailsForm.control}
        name="gender"
        render={({ field }) => (
          <>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.segmentRow}>
              {["Male", "Female", "Prefer not to say"].map((g) => {
                const active = field.value === g;
                return (
                  <TouchableOpacity key={g} style={[styles.segmentBtn, active && styles.segmentBtnActive]} onPress={() => field.onChange(g)} disabled={isLoading}>
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      />

      {/* Date of birth */}
      <Controller
        control={detailsForm.control}
        name="dateOfBirth"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>Date of birth</Text>
            <TouchableOpacity style={[styles.input, styles.dateInput, fieldState.invalid && styles.inputError]} onPress={() => setShowDatePicker(true)} disabled={isLoading}>
              <Text style={field.value ? styles.dateText : styles.placeholderText}>
                {field.value ? new Date(field.value).toLocaleDateString() : "Select date"}
              </Text>
            </TouchableOpacity>
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}

            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              maximumDate={new Date()}
              onConfirm={(date: any) => {
                field.onChange(date);
                setShowDatePicker(false);
              }}
              onCancel={() => setShowDatePicker(false)}
            />
          </>
        )}
      />

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep("otp")} disabled={isLoading}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={detailsForm.handleSubmit(onRegisterSubmit)} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create account</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.loginWrapper}>
        <Text style={styles.loginPrompt}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/login")} disabled={isLoading}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LoginHeaderComponent returnBack={() => router.back()} title="Register" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === "email" && renderEmailStep()}
          {step === "otp" && renderOtpStep()}
          {step === "details" && renderDetailsStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ======================== STYLES ======================== */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { flexGrow: 1, paddingHorizontal: hp(3), paddingTop: hp(4) },
  stepContainer: { width: "100%" },

  // progress
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: hp(2) },
  progressDot: { width: 10, height: 10, borderRadius: 10, backgroundColor: "#E5E7EB" },
  progressDotActive: { backgroundColor: "#6366F1" },
  progressLine: { flex: 1, height: 2, backgroundColor: "#E5E7EB", marginHorizontal: hp(1) },
  progressLineActive: { backgroundColor: "#6366F1" },

  title: { fontSize: hp(3.2), fontWeight: "700", color: "#111827", marginBottom: hp(0.5) },
  subtitle: { fontSize: hp(1.9), color: "#6b7280", marginBottom: hp(2) },

  label: { fontSize: hp(1.8), color: "#374151", marginBottom: hp(0.8), fontWeight: "600" },

  // Input
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: hp(1.2),
    paddingHorizontal: hp(1.6),
    paddingVertical: hp(0.5),
    backgroundColor: "#FAFAFA",
    marginBottom: hp(2),
  },
  inputField: { flex: 1, paddingLeft: hp(1.2), fontSize: hp(2), color: "#111827" },

  input: {
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: hp(1.2),
    paddingVertical: hp(1.6),
    paddingHorizontal: hp(2),
    fontSize: hp(2),
    backgroundColor: "#FAFAFA",
    marginBottom: hp(2),
  },

  dateInput: { justifyContent: "center" },
  dateText: { color: "#111827", fontSize: hp(2) },
  placeholderText: { color: "#9ca3af", fontSize: hp(2) },

  errorText: { color: "#c33", fontSize: hp(1.6), marginBottom: hp(1) },
  inputError: { borderColor: "#FCA5A5" },

  // OTP row
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginTop: hp(1), marginBottom: hp(2) },
  otpBox: {
    width: hp(6.6),
    height: hp(6.6),
    borderRadius: hp(1),
    borderWidth: 0.5,
    borderColor: "#eee",
    textAlign: "center",
    fontSize: hp(2.4),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: "#222",
    borderRadius: hp(1.2),
    paddingVertical: hp(1.6),
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp(1),
    flex: 1,
  },
  primaryBtnText: { color: "#fff", fontSize: hp(2), fontWeight: "600" },

  secondaryBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: hp(1.2),
    paddingVertical: hp(1.2),
    justifyContent: "center",
    alignItems: "center",
    width: hp(10),
    marginRight: hp(1),
  },
  secondaryBtnText: { color: "#374151", fontSize: hp(1.8), fontWeight: "600" },

  btnRow: { flexDirection: "row", marginTop: hp(2) },

  // segmented control for gender
  segmentRow: { flexDirection: "row", borderRadius: hp(1.2), borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden", marginBottom: hp(2) },
  segmentBtn: { paddingVertical: hp(1.2), paddingHorizontal: hp(2.2), backgroundColor: "#fff" },
  segmentBtnActive: { backgroundColor: "#111827" },
  segmentText: { color: "#374151", fontSize: hp(1.7) },
  segmentTextActive: { color: "#fff", fontWeight: "700" },

  loginWrapper: { flexDirection: "row", justifyContent: "center", marginTop: hp(3) },
  loginPrompt: { color: "#6b7280", fontSize: hp(1.8) },
  loginLink: { color: "#222", fontSize: hp(1.8), fontWeight: "600" },
});
