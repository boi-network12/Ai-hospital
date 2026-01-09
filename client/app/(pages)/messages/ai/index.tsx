// app/(messages)/ai-chat.tsx
import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Feather } from '@expo/vector-icons';

interface AIMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI Health Assistant. I can help you with:\n\n• Symptom analysis\n• Medical information\n• Test result explanations\n• Health recommendations\n\nWhat would you like to discuss today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        text: `I understand you're asking about "${inputText}". As an AI assistant, I can provide general information, but please consult a healthcare professional for medical advice.\n\nIs there anything specific about this you'd like me to explain further?`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const renderMessage = ({ item }: { item: AIMessage }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'user' ? styles.userMessageText : styles.aiMessageText
        ]}>
          {item.text}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiAvatar}>
            <Feather name="cpu" size={24} color="#8089ff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Health Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {isLoading ? 'Thinking...' : 'Online • Always available'}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Feather name="more-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          inverted={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListHeaderComponent={() => (
            <View style={styles.welcomeBanner}>
              <Text style={styles.welcomeTitle}>AI Health Consultation</Text>
              <Text style={styles.welcomeText}>
                This AI assistant provides general health information. For medical emergencies, contact your doctor immediately.
              </Text>
            </View>
          )}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your health question..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(3),
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  headerTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: hp(1.3),
    color: '#666',
    marginTop: hp(0.3),
  },
  chatContainer: {
    flex: 1,
  },
  welcomeBanner: {
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    margin: wp(4),
    padding: wp(4),
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8089ff',
  },
  welcomeTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#8089ff',
    marginBottom: hp(1),
  },
  welcomeText: {
    fontSize: hp(1.5),
    color: '#666',
    lineHeight: hp(2.2),
  },
  messagesList: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  messageContainer: {
    marginVertical: hp(1),
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#8089ff',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: hp(1.7),
    lineHeight: hp(2.2),
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: hp(1.1),
    color: '#999',
    marginTop: hp(0.5),
    marginHorizontal: wp(4),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.7),
    maxHeight: hp(15),
    marginRight: wp(2),
  },
  sendButton: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: '#8089ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});