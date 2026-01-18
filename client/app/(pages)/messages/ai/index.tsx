// app/(pages)/messages/ai/index.tsx - Modern UI Update
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '@/Hooks/userHooks.d';
import { useAI, AIMessage as ContextAIMessage } from '@/context/AIContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import DoctorRecommendationCard from '@/components/ai/DoctorRecommendationCard';
import PrescriptionCard from '@/components/ai/PrescriptionCard';
import EmergencyAlert from '@/components/ai/EmergencyAlert';

// Use the type from context
type AIMessage = ContextAIMessage;

export default function AIChatScreen() {
  const router = useRouter();
  const { ai, sendMessage, loading, emergencyTriage, isEmergency } = useAI();
  const { user } = useUser();
  const [inputText, setInputText] = useState('');
  const [showEmergencyOptions, setShowEmergencyOptions] = useState(false);
  const flatListRef = useRef<FlatList<AIMessage>>(null);

  // Initial greeting
  useEffect(() => {
    if (ai.messages.length === 0) {
      console.log('No messages in AI context');
    }
  }, [ai.messages]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const text = inputText.trim();
    setInputText('');
    
    if (isEmergency([text])) {
      Alert.alert(
        '⚠️ Medical Emergency Detected',
        'Your message suggests a possible emergency. Would you like emergency guidance?',
        [
          { text: 'Continue Chat', style: 'cancel' },
          { 
            text: 'Get Emergency Help', 
            style: 'destructive',
            onPress: () => handleEmergency(text)
          }
        ]
      );
      return;
    }
    
    await sendMessage(text);
  };

  const handleEmergencyCall = async () => {
    try {
      // Check if the device can open URLs
      const supported = await Linking.canOpenURL('tel:911');
      
      if (supported) {
        // Open the phone dialer with 911
        await Linking.openURL('tel:911');
      } else {
        Alert.alert(
          'Phone Call Not Supported',
          'Your device does not support phone calls or the phone app is not available.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error making emergency call:', error);
      Alert.alert(
        'Error',
        'Unable to make emergency call. Please dial 911 manually.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEmergency = async (text: string) => {
    const symptoms = [text];
    const result = await emergencyTriage(symptoms, 'severe');
    
    if (result?.isEmergency) {
      Alert.alert(
        '🚨 URGENT MEDICAL ATTENTION NEEDED',
        result.immediateAction,
        [
          { text: 'Call 911', onPress: () => console.log('Calling emergency...') },
          { text: 'Find Hospitals', onPress: () => router.push('/discovery/') },
          { text: 'Share Location', onPress: () => console.log('Sharing location...') }
        ]
      );
    }
  };

  const handleQuickAction = (action: string) => {
    const messages: Record<string, string> = {
      'Find a doctor': "I need to find a specialist. Can you recommend someone nearby?",
      'Medication advice': "I need advice about medications and side effects.",
      'First aid': "I need immediate first aid instructions.",
      'Symptom check': "Can you help me understand these symptoms?",
      'Mental health': "I need support with mental health concerns.",
      'Chronic care': "I have questions about managing chronic conditions."
    };
    
    setInputText(messages[action] || action);
  };

  const renderMessage = ({ item }: { item: AIMessage }) => {
    const isUser = item.role === 'user';
    const content = item.content || item.text || '';
    
    if (!content && !item.type && !item.disclaimer && !item.followUpQuestions && !item.confidence) {
      return null;
    }
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        {!isUser && (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.aiAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="robot" size={18} color="#fff" />
          </LinearGradient>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          {content ? (
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.aiMessageText
            ]}>
              {content}
            </Text>
          ) : null}
          
          {/* Doctor recommendations */}
          {!isUser && item.type === 'doctor_recommendation' && item.recommendations && (
            <View style={styles.cardContainer}>
              <DoctorRecommendationCard
                recommendations={item.recommendations}
                onSelect={(doctorId) => router.push(`/medical/${doctorId}`)}
              />
            </View>
          )}
          
          {/* Prescriptions */}
          {!isUser && item.type === 'drug_prescription' && item.recommendations && (
            <View style={styles.cardContainer}>
              <PrescriptionCard
                recommendations={item.recommendations}
                disclaimer={item.disclaimer}
              />
            </View>
          )}
          
          {/* Emergency alerts */}
          {!isUser && item.type === 'first_aid' && item.confidence && item.confidence > 0.9 && (
            <View style={styles.cardContainer}>
              <EmergencyAlert 
                onCallEmergency={handleEmergencyCall} 
                onFindHospital={() => router.push('/healthcare/hospitals')}
              />
            </View>
          )}
          
          {/* Disclaimer */}
          {!isUser && item.disclaimer && (
            <View style={styles.disclaimerContainer}>
              <Feather name="info" size={14} color="#6366f1" />
              <Text style={styles.disclaimerText}>{item.disclaimer}</Text>
            </View>
          )}
          
          {/* Follow-up questions */}
          {!isUser && item.followUpQuestions && item.followUpQuestions.length > 0 && (
            <View style={styles.followUpContainer}>
              <Text style={styles.followUpTitle}>Follow-up Questions</Text>
              <View style={styles.followUpGrid}>
                {item.followUpQuestions.map((question, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.followUpButton}
                    onPress={() => setInputText(question)}
                  >
                    <Text style={styles.followUpText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {/* Confidence indicator */}
          {!isUser && item.confidence !== undefined && (
            <View style={styles.confidenceContainer}>
              <View style={styles.confidenceHeader}>
                <Text style={styles.confidenceLabel}>AI Confidence</Text>
                <Text style={[
                  styles.confidenceValue,
                  { color: item.confidence > 0.8 ? '#10b981' : item.confidence > 0.6 ? '#f59e0b' : '#ef4444' }
                ]}>
                  {(item.confidence * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={styles.confidenceBar}>
                <LinearGradient
                  colors={item.confidence > 0.8 ? ['#10b981', '#34d399'] : item.confidence > 0.6 ? ['#f59e0b', '#fbbf24'] : ['#ef4444', '#f87171']}
                  style={[
                    styles.confidenceFill,
                    { width: `${item.confidence * 100}%` }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          )}
        </View>
        
        {isUser && (
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.userAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.userAvatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
        )}
      </View>
    );
  };

  const renderMessageWithErrorBoundary = ({ item }: { item: AIMessage }) => {
    try {
      return renderMessage({ item });
    } catch (error) {
      console.error('Error rendering message:', error);
      return (
        <View style={styles.messageContainer}>
          <View style={styles.aiBubble}>
            <Text style={styles.messageText}>
              Error displaying message. Please try again.
            </Text>
          </View>
        </View>
      );
    }
  };

  const quickActions = [
    { icon: 'doctor' as const, label: 'Find a doctor', color: '#6366f1' },
    { icon: 'pill' as const, label: 'Medication advice', color: '#10b981' },
    { icon: 'medical-bag' as const, label: 'First aid', color: '#ef4444' },
    { icon: 'heart-pulse' as const, label: 'Symptom check', color: '#f59e0b' },
    { icon: 'brain' as const, label: 'Mental health', color: '#8b5cf6' },
    { icon: 'chart-line' as const, label: 'Chronic care', color: '#06b6d4' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="#4b5563" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.aiHeaderAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="robot-happy" size={26} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>NeuroMed AI</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.headerSubtitle}>
                  {loading ? 'Analyzing your message...' : 'Online • 89% accuracy'}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowEmergencyOptions(!showEmergencyOptions)}
            style={styles.emergencyIcon}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.emergencyIconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="alert-triangle" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Emergency Options - Modern Dropdown */}
      {showEmergencyOptions && (
        <BlurView intensity={80} style={styles.emergencyOptions}>
          <View style={styles.emergencyOptionsContent}>
            <Text style={styles.emergencyTitle}>Emergency Assistance</Text>
            <View style={styles.emergencyGrid}>
              <TouchableOpacity 
                style={styles.emergencyCard}
                onPress={() => handleEmergencyCall()}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.emergencyCardIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name="phone" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.emergencyCardLabel}>Call 911</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.emergencyCard}
                onPress={() => router.push('/discovery?tab=hospitals')}
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.emergencyCardIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name="map-pin" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.emergencyCardLabel}>Find Hospitals</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.emergencyCard}
                onPress={() => console.log('Share location')}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.emergencyCardIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name="share-2" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.emergencyCardLabel}>Share Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      )}

      {/* Quick Actions - Modern Cards */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <FlatList
          horizontal
          data={quickActions}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsList}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={() => handleQuickAction(item.label)}
            >
              <LinearGradient
                colors={[`${item.color}15`, `${item.color}08`]}
                style={styles.quickActionIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
              </LinearGradient>
              <Text style={[styles.quickActionLabel, { color: item.color }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={ai.messages}
          renderItem={renderMessageWithErrorBoundary}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={() => (
            <View style={styles.welcomeBanner}>
              <LinearGradient
                colors={['#f0f9ff', '#e0f2fe']}
                style={styles.welcomeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.welcomeIcon}>
                  <MaterialCommunityIcons name="robot" size={32} color="#6366f1" />
                </View>
                <Text style={styles.welcomeTitle}>Your AI Health Assistant</Text>
                <Text style={styles.welcomeText}>
                  I&apos;m here to provide accurate medical information with 89% confidence. 
                  Remember, I&apos;m not a substitute for professional medical advice.
                </Text>
                <View style={styles.welcomeStats}>
                  <View style={styles.statItem}>
                    <Feather name="shield" size={16} color="#10b981" />
                    <Text style={styles.statText}>HIPAA Compliant</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Feather name="clock" size={16} color="#6366f1" />
                    <Text style={styles.statText}>24/7 Available</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.emptyStateText}>Initializing AI assistant...</Text>
            </View>
          )}
        />

        {/* Modern Input Area */}
        <BlurView intensity={90} style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Describe symptoms or ask medical questions..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={1000}
              editable={!loading}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name="send" size={20} color="#fff" />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
          
          {inputText.length > 0 && (
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>
                {inputText.length}/1000
              </Text>
              <TouchableOpacity onPress={() => setInputText('')}>
                <Feather name="x" size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}
        </BlurView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? hp(1) : hp(2),
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
  },
  backButton: {
    padding: wp(1),
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(3),
  },
  aiHeaderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.3),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: wp(1),
  },
  headerSubtitle: {
    fontSize: hp(1.3),
    color: '#64748b',
    fontWeight: '500',
  },
  emergencyIcon: {
    padding: wp(1),
  },
  emergencyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyOptions: {
    position: 'absolute',
    top: hp(11),
    right: wp(4),
    width: wp(85),
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  emergencyOptionsContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: wp(4),
    borderRadius: 16,
  },
  emergencyTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  emergencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  emergencyCard: {
    alignItems: 'center',
    width: wp(26),
  },
  emergencyCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  emergencyCardLabel: {
    fontSize: hp(1.3),
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActionsContainer: {
    backgroundColor: '#fff',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#475569',
    marginLeft: wp(4),
    marginBottom: hp(1.5),
  },
  quickActionsList: {
    paddingHorizontal: wp(3),
  },
  quickActionCard: {
    alignItems: 'center',
    marginRight: wp(3),
    width: wp(22),
  },
  quickActionIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  quickActionLabel: {
    fontSize: hp(1.1),
    fontWeight: '600',
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  welcomeBanner: {
    padding: wp(4),
  },
  welcomeGradient: {
    padding: wp(5),
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  welcomeTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: hp(1),
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: hp(1.5),
    color: '#64748b',
    textAlign: 'center',
    lineHeight: hp(2.2),
    marginBottom: hp(2),
  },
  welcomeStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(4),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  statText: {
    fontSize: hp(1.3),
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(20),
  },
  emptyStateText: {
    fontSize: hp(1.6),
    color: '#94a3b8',
    marginTop: hp(2),
    fontWeight: '500',
  },
  messagesList: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  messageContainer: {
    marginVertical: hp(1.2),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2),
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(0.3),
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(0.3),
  },
  userAvatarText: {
    fontSize: hp(1.4),
    fontWeight: '700',
    color: '#fff',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 0.6,
    borderWidth: 0.5,
    borderColor: '#f1f5f9',
  },
  messageText: {
    fontSize: hp(1.6),
    lineHeight: hp(2.4),
  },
  userMessageText: {
    color: '#fff',
    fontWeight: '500',
  },
  aiMessageText: {
    color: '#334155',
    fontWeight: '400',
  },
  cardContainer: {
    marginTop: hp(1.5),
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    padding: hp(1.5),
    borderRadius: 12,
    marginTop: hp(1.5),
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  disclaimerText: {
    fontSize: hp(1.3),
    color: '#4f46e5',
    marginLeft: wp(1.5),
    flex: 1,
    lineHeight: hp(1.8),
  },
  followUpContainer: {
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  followUpTitle: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: '#475569',
    marginBottom: hp(1),
  },
  followUpGrid: {
    gap: hp(0.8),
  },
  followUpButton: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  followUpText: {
    fontSize: hp(1.4),
    color: '#475569',
    fontStyle: 'italic',
  },
  confidenceContainer: {
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  confidenceLabel: {
    fontSize: hp(1.3),
    color: '#64748b',
    fontWeight: '500',
  },
  confidenceValue: {
    fontSize: hp(1.4),
    fontWeight: '600',
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  inputContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: Platform.OS === 'ios' ? hp(4) : hp(2),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.5)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: wp(2),
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
    fontSize: hp(1.6),
    maxHeight: hp(15),
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0.8,
  },
  sendButton: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(1),
    paddingHorizontal: wp(1),
  },
  charCount: {
    fontSize: hp(1.2),
    color: '#94a3b8',
  },
});