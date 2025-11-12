import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput as RNTextInput, ActivityIndicator } from 'react-native';
import React, { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginHeaderComponent from '@/components/Headers/LoginHeaderComponent';
import { useRouter } from 'expo-router';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAuth } from '@/Hooks/authHook.d';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Refs to control focus
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login({ email, password }); // Calls your API via context
      // No need for manual navigation—your _layout.tsx useEffect handles /home redirect
    } catch (err: any) {
      setError(err.message || 'Login failed. Try again.');
      // Optional: Use a modal alert here, e.g., showCustomAlert('Error', error)
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = () => {
    passwordRef.current?.focus();
  };

  // Simple inline error (replace with modal lib for better UX)
  if (error) {
    // You can extract this to a <ErrorAlert /> component
    setTimeout(() => setError(''), 4000); // Auto-hide
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LoginHeaderComponent returnBack={() => router.back()} title="Login" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          {/* ---------- Form ---------- */}
          <View style={styles.form}>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={handleEmailSubmit}
              blurOnSubmit={false}
              selectionColor="#8089ff"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#aaa"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              selectionColor="#8089ff"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => router.push('/forgot-password')}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading}>
              <Text style={styles.loginBtnText}>
                {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Login</Text>
              )}
              </Text>
            </TouchableOpacity>

            {/* Sign-up link */}
            <View style={styles.signupWrapper}>
              <Text style={styles.signupPrompt}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')} disabled={isLoading}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* --------------------------------------------------------------
   STYLES – unchanged, just kept for completeness
   -------------------------------------------------------------- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: hp(3),
    paddingTop: hp(4),
  },

  form: {
    width: '100%',
  },
  label: {
    fontSize: hp(1.8),
    color: '#555',
    marginBottom: hp(0.8),
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: hp(1.2),
    paddingVertical: hp(1.6),
    paddingHorizontal: hp(2),
    fontSize: hp(2),
    backgroundColor: '#fafafa',
    marginBottom: hp(2.5),
    color: "#333"
  },

  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: hp(3),
  },
  forgotText: {
    color: '#8089ff',
    fontSize: hp(1.7),
  },

  loginBtn: {
    backgroundColor: '#8089ff',
    borderRadius: hp(1.2),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    marginBottom: hp(3),
  },
  loginBtnText: {
    color: '#fff',
    fontSize: hp(2.1),
    fontWeight: '600',
  },

  signupWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupPrompt: {
    color: '#777',
    fontSize: hp(1.8),
  },
  signupLink: {
    color: '#8089ff',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: hp(1),
    padding: hp(1.5),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c33',
    fontSize: hp(1.7),
    textAlign: 'center',
  },
});