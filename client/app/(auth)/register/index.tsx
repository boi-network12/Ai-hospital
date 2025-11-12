/* app/(auth)/register.tsx */
import React, { useState, useRef } from 'react';
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
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '@/Hooks/authHook.d';
import LoginHeaderComponent from '@/components/Headers/LoginHeaderComponent';

// ---------- Yup schemas ----------
const emailSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
});

const otpSchema = yup.object({
  otp: yup
    .string()
    .required('OTP is required'),
});

const registerSchema = yup.object({
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  name: yup.string().required('Name is required'),
  phoneNumber: yup
    .string()
    .matches(/^\d{10,15}$/, 'Enter a valid phone number')
    .required('Phone number is required'),
  gender: yup
    .string()
    .oneOf(['Male', 'Female', 'Other', 'Prefer not to say'])
    .required('Select gender'),
  dateOfBirth: yup.date().nullable().required('Date of birth is required'),
});

// ---------- Types ----------
type EmailForm = yup.InferType<typeof emailSchema>;
type OtpForm = yup.InferType<typeof otpSchema>;
type RegisterForm = yup.InferType<typeof registerSchema>;

export default function RegisterPage() {
  const { requestOtp, verifyOtpAndFinishRegister } = useAuth();
  const router = useRouter();

  // ---------- UI State ----------
  const [step, setStep] = useState<'email' | 'otp' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ---------- Form Hooks ----------
  const emailForm = useForm<EmailForm>({ resolver: yupResolver(emailSchema) });
  const otpForm = useForm<OtpForm>({ resolver: yupResolver(otpSchema) });
  const detailsForm = useForm<RegisterForm>({ resolver: yupResolver(registerSchema) });

  // ---------- Animation ----------
  React.useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // ---------- Step 1: Email ----------
  const onEmailSubmit = async (data: EmailForm) => {
    setIsLoading(true);
    try {
      await requestOtp({ email: data.email });
      setEmail(data.email);
      setStep('otp');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Step 2: OTP ----------
  const onOtpSubmit = async () => {
    const isValid = await otpForm.trigger();
    if (!isValid) return;

    setIsLoading(true);
    try {
      setStep('details'); // OTP verified on backend in final step
    } catch (e: any) {
      Alert.alert('Invalid OTP', e.message || 'Please check the code');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Step 3: Final Register ----------
  const onRegisterSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const isoDate = data.dateOfBirth 
        ? new Date(data.dateOfBirth).toISOString()  // "2025-01-01T00:00:00.000Z"
        : undefined;

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
      Alert.alert('Registration failed', e.message || 'Try again');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Render Helpers ----------
  const renderEmailStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Enter your email to get started</Text>

      <Controller
        control={emailForm.control}
        name="email"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, fieldState.invalid && styles.inputError]}
              placeholder="you@example.com"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isLoading}
            />
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
          </>
        )}
      />

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={emailForm.handleSubmit(onEmailSubmit)}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Request OTP</Text>}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderOtpStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>Check your email ({email})</Text>

      <Controller
        control={otpForm.control}
        name="otp"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>6-digit OTP</Text>
            <TextInput
              style={[styles.input, styles.otpInput, fieldState.invalid && styles.inputError]}
              placeholder="------"
              keyboardType="default"
              maxLength={6}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isLoading}
            />
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
          </>
        )}
      />

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('email')} disabled={isLoading}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onOtpSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Next</Text>}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderDetailsStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Complete Profile</Text>

      {/* Password */}
      <Controller
        control={detailsForm.control}
        name="password"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, fieldState.invalid && styles.inputError]}
              placeholder="••••••••"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isLoading}
            />
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
          </>
        )}
      />

      {/* Name */}
      <Controller
        control={detailsForm.control}
        name="name"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, fieldState.invalid && styles.inputError]}
              placeholder="John Doe"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isLoading}
            />
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
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, fieldState.invalid && styles.inputError]}
              placeholder="1234567890"
              keyboardType="phone-pad"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isLoading}
            />
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
          </>
        )}
      />

      {/* Gender */}
      <Controller
        control={detailsForm.control}
        name="gender"
        render={({ field }) => (
          <>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Prefer not to say'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, field.value === g && styles.genderBtnActive]}
                  onPress={() => field.onChange(g)}
                  disabled={isLoading}
                >
                  <Text style={[styles.genderBtnText, field.value === g && styles.genderBtnTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      />

      {/* Date of Birth */}
      <Controller
        control={detailsForm.control}
        name="dateOfBirth"
        render={({ field, fieldState }) => (
          <>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={[styles.input, styles.dateInput, fieldState.invalid && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              disabled={isLoading}
            >
              <Text style={field.value ? styles.dateText : styles.placeholderText}>
                {field.value ? field.value.toLocaleDateString() : 'Select date'}
              </Text>
            </TouchableOpacity>
            {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}

            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              onConfirm={(date: any) => {
                field.onChange(date);
                setShowDatePicker(false);
              }}
              onCancel={() => setShowDatePicker(false)}
              maximumDate={new Date()}
            />
          </>
        )}
      />

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('otp')} disabled={isLoading}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={detailsForm.handleSubmit(onRegisterSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.loginWrapper}>
        <Text style={styles.loginPrompt}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/login')} disabled={isLoading}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LoginHeaderComponent returnBack={() => router.back()} title="Register" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'email' && renderEmailStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'details' && renderDetailsStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ==============================================================
   STYLES – MATCHING YOUR LOGIN PAGE (clean, professional)
   ============================================================== */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: hp(3), paddingTop: hp(4) },
  stepContainer: { width: '100%' },
  title: { fontSize: hp(3.2), fontWeight: '700', color: '#222', marginBottom: hp(1) },
  subtitle: { fontSize: hp(1.9), color: '#666', marginBottom: hp(3) },
  label: { fontSize: hp(1.8), color: '#555', marginBottom: hp(0.8), fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: hp(1.2),
    paddingVertical: hp(1.6),
    paddingHorizontal: hp(2),
    fontSize: hp(2),
    backgroundColor: '#fafafa',
    marginBottom: hp(2),
  },
  inputError: { borderColor: '#c33' },
  otpInput: { letterSpacing: 10, textAlign: 'center', fontSize: hp(2.6) },
  dateInput: { justifyContent: 'center' },
  dateText: { color: '#222', fontSize: hp(2) },
  placeholderText: { color: '#aaa', fontSize: hp(2) },
  errorText: { color: '#c33', fontSize: hp(1.6), marginBottom: hp(1) },

  primaryBtn: {
    backgroundColor: '#222', // Dark neutral
    borderRadius: hp(1.2),
    paddingVertical: hp(1.8),
    justifyContent: "center",
    alignItems: 'center',
    marginTop: hp(1),
    flex: 1
  },
  primaryBtnText: { color: '#fff', fontSize: hp(2), fontWeight: '600' },

  secondaryBtn: {
    backgroundColor: '#eee',
    borderRadius: hp(1.2),
    paddingVertical: hp(1),
    justifyContent: "center",
    alignItems: 'center',
    width: hp(10),
    marginRight: hp(1),
  },
  secondaryBtnText: { color: '#555', fontSize: hp(1.8), fontWeight: '500' },

  btnRow: { flexDirection: 'row', marginTop: hp(2) },

  genderRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: hp(2) },
  genderBtn: {
    paddingHorizontal: hp(2),
    paddingVertical: hp(1),
    borderRadius: hp(1),
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: hp(1),
    marginBottom: hp(1),
  },
  genderBtnActive: { backgroundColor: '#222', borderColor: '#222' },
  genderBtnText: { color: '#555', fontSize: hp(1.8) },
  genderBtnTextActive: { color: '#fff', fontWeight: '600' },

  loginWrapper: { flexDirection: 'row', justifyContent: 'center', marginTop: hp(4) },
  loginPrompt: { color: '#777', fontSize: hp(1.8) },
  loginLink: { color: '#222', fontSize: hp(1.8), fontWeight: '600' },
});