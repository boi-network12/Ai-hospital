// app/(pages)/messages/[chatId]/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useChat, useChatMedia } from '@/context/ChatContext';
import { useUser } from '@/Hooks/userHooks.d';
import { useToast } from '@/Hooks/useToast.d';
import { ChatMessage } from '@/types/chat';
import { format, formatDistanceToNow } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import MediaActionSheet from '@/components/customs/MediaActionSheet';
import { generateThumbnailUrl } from '@/Utils/thumbnailUtils';
import ImagePreviewModal from '@/components/customs/ImagePreviewModal';


// ============================================
// COMPONENTS
// ============================================

// 1. Reaction Picker Component
interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = React.memo(({ visible, onClose, onSelect }) => {
  const reactions = ['😀', '😍', '😂', '😮', '😢', '👍', '❤️', '🎉', '🔥', '👏'];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.reactionPickerOverlay} onPress={onClose}>
        <View style={styles.reactionPicker}>
          {reactions.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionEmoji}
              onPress={() => {
                onSelect(emoji);
                onClose();
              }}
            >
              <Text style={styles.reactionEmojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
});

ReactionPicker.displayName = 'ReactionPicker';

// 2. Message Menu Component
interface MessageMenuProps {
  visible: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
  onCopy: (text: string) => void;
  isOwnMessage: boolean;
}

const MessageMenu: React.FC<MessageMenuProps> = React.memo(({
  visible,
  onClose,
  message,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  isOwnMessage,
}) => {
  const menuItems = [
    { id: 'reply', label: 'Reply', icon: 'corner-up-left' },
    { id: 'copy', label: 'Copy', icon: 'copy' },
  ];

  if (isOwnMessage && message) {
    menuItems.push(
      { id: 'edit', label: 'Edit', icon: 'edit-2' },
      { id: 'delete', label: 'Delete', icon: 'trash-2' }
    );
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.messageMenuOverlay} onPress={onClose}>
        <View style={styles.messageMenu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.messageMenuItem}
              onPress={() => {
                if (!message) return;
                switch (item.id) {
                  case 'reply':
                    onReply(message);
                    break;
                  case 'edit':
                    onEdit(message);
                    break;
                  case 'delete':
                    onDelete(message);
                    break;
                  case 'copy':
                    onCopy(message.content || '');
                    break;
                }
                onClose();
              }}
            >
              <Feather name={item.icon as any} size={20} color="#333" />
              <Text style={styles.messageMenuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
});

MessageMenu.displayName = 'MessageMenu';

// 3. Message Item Component
interface MessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onLongPress: (msg: ChatMessage) => void;
  onPreviewMedia?: (url: string, type: 'image' | 'video') => void;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ message, isOwnMessage, onLongPress, onPreviewMedia }) => {
  const { user } = useUser();
  const { addReaction } = useChat();

  const getStatusIcon = () => {
    if (message.status === 'sending' || message.status === 'updating') {
      return <ActivityIndicator size={12} color="#999" />;
    }
    
    if (message.status === 'failed') {
      return <Feather name="alert-circle" size={16} color="#ff4444" />;
    }

    switch (message.status) {
      case 'sent':
        return <Feather name="check" size={16} color="#999" />;
      case 'delivered':
        return (
          <View style={{ flexDirection: 'row' }}>
            <Feather name="check" size={16} color="#999" style={{ marginLeft: -8 }} />
            <Feather name="check" size={16} color="#999" />
          </View>
        );
      case 'read':
        return (
          <View style={{ flexDirection: 'row' }}>
            <Feather name="check" size={16} color="#4CAF50" style={{ marginLeft: -8 }} />
            <Feather name="check" size={16} color="#4CAF50" />
          </View>
        );
      default:
        return null;
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      return format(new Date(date), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const handleReactionPress = (emoji: string) => {
    addReaction(message._id.toString(), emoji);
  };

  const renderMessageContent = () => {
    if (message.messageType === 'image' && message.fileUrl) {
      return (
        <TouchableOpacity 
            onPress={() => {
            if (message.fileUrl && onPreviewMedia) {
              onPreviewMedia(message.fileUrl, 'image');
            }
          }}
          activeOpacity={0.8}
        >
          <Image 
            source={{ uri: message.fileUrl }} 
            style={styles.messageImage} 
            resizeMode="cover" 
          />
          {/* {message.content && (
            <Text style={[styles.otherMessageText, { marginTop: hp(1) }]}>
              {message.content}
            </Text>
          )} */}
        </TouchableOpacity>
      );
    }
      
    // Video message
    if (message.messageType === 'video') {
      const thumbnailUrl = message.thumbnailUrl || generateThumbnailUrl(message.fileUrl, 'video');

      return (
        <TouchableOpacity 
          style={styles.videoContainer}
          onPress={() => {
             if (message.fileUrl && onPreviewMedia) {
              onPreviewMedia(message.fileUrl, 'video');
            }
          }}
          activeOpacity={0.8}
        >
           {thumbnailUrl ? (
              <Image 
                source={{ uri: thumbnailUrl }} 
                style={styles.videoThumbnail} 
                resizeMode="cover" 
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderIcon}>🎬</Text>
                <Text style={styles.videoPlaceholderText}>Video</Text>
              </View>
            )}
          <View style={styles.videoOverlay}>
            <Feather name="play" size={24} color="#fff" />
          </View>
          {/* {message.fileName && (
            <View style={styles.videoInfo}>
              <Text style={styles.videoFileName} numberOfLines={1}>
                {message.fileName}
              </Text>
            </View>
          )} */}
        </TouchableOpacity>
      );
    }
    
    // Audio message
    if (message.messageType === 'audio') {
      return (
        <View style={styles.audioContainer}>
          <TouchableOpacity style={styles.audioPlayButton}>
            <Feather name="play" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.audioInfo}>
            <Text style={styles.audioTitle}>Voice message</Text>
            <Text style={styles.audioDuration}>
              {message.fileSize ? `${Math.round(message.fileSize / 1000)}KB` : 'Audio'}
            </Text>
          </View>
        </View>
      );
    }

    // File message
    if (message.messageType === 'file') {
      return (
        <TouchableOpacity 
          style={styles.fileContainer}
          onPress={() => {
            Alert.alert(
              'Download File',
              `Would you like to download ${message.fileName || 'this file'}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Download', onPress: () => {
                  // Handle file download
                  console.log('Download file:', message.fileUrl);
                }},
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <Feather name="file" size={24} color="#666" />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {message.fileName || 'File'}
            </Text>
            <Text style={styles.fileSize}>
              {message.fileSize ? (message.fileSize / 1024).toFixed(1) : '0'} KB
            </Text>
          </View>
          <Feather name="download" size={20} color="#8089ff" />
        </TouchableOpacity>
      );
    }

    return (
      <Text style={isOwnMessage ? styles.ownMessageText : styles.otherMessageText}>
        {message.content || ''}
      </Text>
    );
  };

  return (
    <View style={[
      styles.messageContainer, 
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {/* Reply Preview */}
      {message.replyToMessage && (
        <View style={styles.replyContainer}>
          <View style={styles.replyLine} />
          <View style={styles.replyContent}>
            <Text style={styles.replyName}>
              {message.replyToMessage.sender?.name || 'Unknown'}
            </Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {message.replyToMessage.content || ''}
            </Text>
          </View>
        </View>
      )}

      {/* Message Bubble */}
      <TouchableOpacity
        style={[
          styles.messageBubble, 
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}
        onLongPress={() => onLongPress(message)}
        activeOpacity={0.8}
        delayLongPress={300}
      >
        {renderMessageContent()}
        
        {message.isEdited && (
          <Text style={styles.editedText}>(edited)</Text>
        )}
      </TouchableOpacity>

      {/* Message Footer */}
      <View style={[
        styles.messageFooter, 
        isOwnMessage ? styles.ownMessageFooter : styles.otherMessageFooter
      ]}>
        <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>
        {isOwnMessage && (
          <View style={styles.statusContainer}>
            {getStatusIcon()}
            {message.readBy && message.readBy.length > 1 && (
              <Text style={styles.readCount}>{message.readBy.length - 1}</Text>
            )}
          </View>
        )}
      </View>

      {/* Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <View style={[
          styles.reactionsContainer, 
          { justifyContent: isOwnMessage ? 'flex-end' : 'flex-start' }
        ]}>
          {message.reactions.map((reaction, index) => (
            <TouchableOpacity
              key={`${reaction.userId}-${index}`}
              style={[
                styles.reactionBadge,
                reaction.userId === user?._id && styles.ownReactionBadge,
              ]}
              onPress={() => handleReactionPress(reaction.emoji)}
            >
              <Text style={styles.reactionEmojiText}>{reaction.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

MessageItem.displayName = 'MessageItem';

// 4. Typing Indicator Component
interface TypingIndicatorProps {
  typingUsers: Set<string>;
  participants: any[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = React.memo(({ typingUsers, participants }) => {
  if (typingUsers.size === 0) return null;

  const typingUserNames = Array.from(typingUsers).map(userId => {
    const user = participants?.find(p => p._id === userId);
    return user?.name || 'Someone';
  });

  const getTypingText = () => {
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing...`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
    } else {
      return `${typingUserNames[0]}, ${typingUserNames[1]} and ${typingUserNames.length - 2} others are typing...`;
    }
  };

  return (
    <View style={styles.typingIndicatorContainer}>
      <View style={styles.typingIndicatorBubble}>
        <View style={styles.typingDots}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, styles.typingDotMiddle]} />
          <View style={styles.typingDot} />
        </View>
        <Text style={styles.typingText}>{getTypingText()}</Text>
      </View>
    </View>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

// 5. Input Preview Components
interface ReplyPreviewProps {
  replyTo: ChatMessage | null;
  onCancel: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = React.memo(({ replyTo, onCancel }) => {
  if (!replyTo) return null;

  return (
    <View style={styles.replyPreview}>
      <View style={styles.replyPreviewContent}>
        <Text style={styles.replyPreviewName}>
          Replying to {replyTo.sender?.name || 'User'}
        </Text>
        <Text style={styles.replyPreviewText} numberOfLines={1}>
          {replyTo.content || ''}
        </Text>
      </View>
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.replyPreviewClose}>✕</Text>
      </TouchableOpacity>
    </View>
  );
});

ReplyPreview.displayName = 'ReplyPreview';

interface EditPreviewProps {
  editingMessage: ChatMessage | null;
  onCancel: () => void;
}

const EditPreview: React.FC<EditPreviewProps> = React.memo(({ editingMessage, onCancel }) => {
  if (!editingMessage) return null;

  return (
    <View style={styles.editPreview}>
      <Text style={styles.editPreviewText}>Editing message</Text>
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.editPreviewClose}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
});

EditPreview.displayName = 'EditPreview';

// ============================================
// MAIN CHAT SCREEN
// ============================================

const ChatScreen: React.FC = () => {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { showAlert } = useToast();
  const { user } = useUser();
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');
  
  
  const {
    activeChat,
    messages,
    loading,
    sending,
    typingUsers,
    sendMessage,
    setTyping,
    markAsRead,
    addReaction,
    editMessage,
    deleteMessage,
    setActiveChat,
    loadChatRoom,
    loadMessages
  } = useChat();

  const { 
    sendMediaMessage, 
    takePhoto, 
    pickImage, 
    pickVideo, 
    pickDocument,
    isUploading: mediaUploading,
    uploadProgress: mediaProgress 
  } = useChatMedia();

  useEffect(() => {
    setUploadingFile(mediaUploading);
    setUploadProgress(mediaProgress);
  }, [mediaUploading, mediaProgress]);

  const pathname = usePathname();
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);

  const navigationStateRef = useRef<'initializing' | 'ready' | 'loading'>('initializing');
  const [isScreenReady, setIsScreenReady] = useState(false);


  // ============================================
  // EFFECTS
  // ============================================

  // Initialize chat
  useEffect(() => {
    if (!chatId || navigationStateRef.current === 'ready') {
      return;
    }

    const initializeChat = async () => {
      if (navigationStateRef.current === 'loading') {
        return;
      }

      navigationStateRef.current = 'loading';
      
      try {
        console.log('ChatScreen: Initializing chat...', chatId);
        
        // Check if we're already in this chat
        if (activeChat?._id.toString() === chatId && messages.length > 0) {
          console.log('Already in this chat, skipping initialization');
          navigationStateRef.current = 'ready';
          setIsScreenReady(true);
          return;
        }
        
        // Load chat room
        const chatRoom = await loadChatRoom(chatId);
        
        if (chatRoom) {
          // Load messages
          await loadMessages(chatRoom._id.toString());
          
          // Mark as ready
          navigationStateRef.current = 'ready';
          setIsScreenReady(true);
        }
      } catch (error) {
        console.error('ChatScreen: Failed to initialize chat:', error);
          showAlert({ message: 'Failed to load chat', type: 'error' });
          
          // Check if it's a 404 error - safely access error properties
          const errorMessage = error instanceof Error ? error.message : String(error);
          const statusCode = (error as any)?.response?.status || (error as any)?.status;
          
          if (errorMessage.includes('404') || statusCode === 404) {
            router.replace('/(tabs)/messages'); 
        } else {
          router.back();
        }
      }
    };

    initializeChat();

    return () => {
      // Only clear active chat if navigating to a different chat
      if (pathname && chatId && !pathname.includes(chatId)) {
        setActiveChat(null);
      }
      navigationStateRef.current = 'initializing';
      setIsScreenReady(false);
    };
  }, [chatId, pathname]); 

  // Mark messages as read
  useEffect(() => {
    if (!user || !activeChat || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (msg) => 
        !msg.readBy?.includes(user._id) && 
        msg.senderId !== user._id
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        markAsRead(msg._id.toString());
      });
    }
  }, [messages, user, activeChat, markAsRead]);


  const handlePreviewMedia = useCallback((url: string, type: 'image' | 'video') => {
    setPreviewImage(url);
    setPreviewType(type);
    setShowImagePreview(true);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleTextChange = useCallback((text: string) => {
    setMessageText(text);
    
    // Send typing indicator
    if (activeChat) {
      const isTyping = text.length > 0;
      setTyping(isTyping);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Clear typing after 1.5 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 1500);
    }
  }, [activeChat, setTyping]);

  const handleSend = useCallback(async () => {
    const trimmedText = messageText.trim();
    if (!trimmedText && !editingMessage) return;
    
    try {
      if (editingMessage) {
        // Edit existing message
        await editMessage(editingMessage._id.toString(), trimmedText);
        setEditingMessage(null);
      } else {
        // Send new message
        await sendMessage(trimmedText, replyTo?._id.toString());
        setReplyTo(null);
      }
      
      // Reset input
      setMessageText('');
      setTyping(false);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      showAlert({ message: 'Failed to send message', type: 'error' });
    }
  }, [messageText, editingMessage, replyTo, sendMessage, editMessage, setTyping, showAlert]);

  const handleMessageLongPress = useCallback((message: ChatMessage) => {
    setSelectedMessage(message);
    setShowMessageMenu(true);
  }, []);

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo(message);
    inputRef.current?.focus();
  }, []);

  const handleEdit = useCallback((message: ChatMessage) => {
    setEditingMessage(message);
    setMessageText(message.content || '');
    inputRef.current?.focus();
  }, []);

  const handleDelete = useCallback((message: ChatMessage) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete for me', 
          onPress: () => deleteMessage(message._id.toString(), false) 
        },
        { 
          text: 'Delete for everyone', 
          style: 'destructive',
          onPress: () => deleteMessage(message._id.toString(), true) 
        },
      ]
    );
  }, [deleteMessage]);

  const handleCopy = useCallback((text: string) => {
    showAlert({ message: 'Message copied to clipboard', type: 'success' });
  }, [showAlert]);

  const handleAddReaction = useCallback((emoji: string) => {
    if (selectedMessage) {
      addReaction(selectedMessage._id.toString(), emoji);
    }
  }, [selectedMessage, addReaction]);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setMessageText('');
  }, []);

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderHeader = () => {
    const otherParticipant = activeChat?.participantsData?.find((p) => p._id !== user?._id);
    
    // Get accurate online status
    const isOtherOnline = otherParticipant?.isOnline || false;
    
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {activeChat?.isGroup ? (
            <>
              <Text style={styles.headerTitle}>
                {activeChat.groupName || 'Group Chat'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {activeChat.participantsData?.filter(p => p.isOnline).length || 0} online • 
                {activeChat.participantsData?.length || 0} total
              </Text>
            </>
          ) : (
            <>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle}>
                  {otherParticipant?.name || 'Chat'}
                </Text>
                {isOtherOnline && (
                  <View style={styles.onlineIndicator} />
                )}
              </View>
              <Text style={styles.headerSubtitle}>
                {isOtherOnline ? 'Online' : 
                  otherParticipant?.lastActive ? 
                  `Last seen ${formatDistanceToNow(new Date(otherParticipant.lastActive), { addSuffix: true })}` : 
                  'Offline'
                }
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity>
          <Feather name="more-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    );
  };

  const handleTakePhoto = async () => {
      try {
        await takePhoto();
        setShowMediaSheet(false);
      } catch (error) {
        console.error('Failed to take photo:', error);
      }
    };

    const handlePickImage = async () => {
      try {
        const file = await pickImage();
        if (file) {
          await sendMediaMessage(file, 'image');
          setShowMediaSheet(false);
        }
      } catch (error) {
        console.error('Failed to pick image:', error);
      }
    };

    const handlePickVideo = async () => {
      try {
        const file = await pickVideo();
        if (file) {
          await sendMediaMessage(file, 'video');
          setShowMediaSheet(false);
        }
      } catch (error) {
        console.error('Failed to pick video:', error);
      }
    };

    const handlePickDocument = async () => {
      try {
        const file = await pickDocument();
        if (file) {
          await sendMediaMessage(file, 'file');
          setShowMediaSheet(false);
        }
      } catch (error) {
        console.error('Failed to pick document:', error);
      }
    };

  const renderInputArea = () => (
    <View style={styles.inputContainer}>
      <TouchableOpacity style={styles.attachButton} onPress={() => setShowMediaSheet(true)} disabled={uploadingFile}>
        {uploadingFile ? (
          <View style={styles.uploadProgressContainer}>
            <ActivityIndicator size="small" color="#8089ff" />
            <Text style={styles.uploadProgressText}>
              {uploadProgress}%
            </Text>
          </View>
        ) : (
          <Feather name="paperclip" size={24} color="#666" />
        )}
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        style={styles.textInput}
        value={messageText}
        onChangeText={handleTextChange}
        placeholder="Type a message..."
        multiline
        maxLength={1000}
        onFocus={() => messageText.length > 0 && setTyping(true)}
        onBlur={() => setTyping(false)}
      />

      <TouchableOpacity
        style={[
          styles.sendButton,
          (!messageText.trim() && !editingMessage) && styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={!messageText.trim() && !editingMessage}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Feather name="send" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // RENDER
  // ============================================

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8089ff" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={[...messages].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )}
          renderItem={({ item }) => (
            <MessageItem
              message={item}
              isOwnMessage={item.senderId === user?._id}
              onLongPress={handleMessageLongPress}
              onPreviewMedia={handlePreviewMedia}
            />
          )}
          keyExtractor={(item) => item._id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            // Auto-scroll to bottom when new messages arrive
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          ListFooterComponent={() => (
            <TypingIndicator 
              typingUsers={typingUsers}
              participants={activeChat?.participantsData || []}
            />
          )}
        />

        <ReplyPreview replyTo={replyTo} onCancel={handleCancelReply} />
        <EditPreview editingMessage={editingMessage} onCancel={handleCancelEdit} />
        {renderInputArea()}
      </KeyboardAvoidingView>


      <MediaActionSheet
        visible={showMediaSheet}
        onClose={() => setShowMediaSheet(false)}
        onTakePhoto={handleTakePhoto}
        onPickImage={handlePickImage}
        onPickVideo={handlePickVideo}
        onPickDocument={handlePickDocument}
      />

      <ReactionPicker
        visible={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
        onSelect={handleAddReaction}
      />

      <MessageMenu
        visible={showMessageMenu}
        onClose={() => {
          setShowMessageMenu(false);
          setSelectedMessage(null);
        }}
        message={selectedMessage}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCopy={handleCopy}
        isOwnMessage={selectedMessage?.senderId === user?._id}
      />

      <ImagePreviewModal
        visible={showImagePreview}
        imageUrl={previewImage || ''}
        onClose={() => {
          setShowImagePreview(false);
          setPreviewImage(null);
        }}
        type={previewType}
      />
    </SafeAreaView>
  );
};

ChatScreen.displayName = 'ChatScreen';

export default ChatScreen;

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.6),
    color: '#666',
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
    marginHorizontal: wp(3),
  },
  headerTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: hp(1.4),
    color: '#666',
    marginTop: hp(0.3),
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  messageContainer: {
    marginVertical: hp(0.5),
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderRadius: 20,
  },
  ownMessageBubble: {
    backgroundColor: '#8089ff',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  ownMessageText: {
    color: '#fff',
    fontSize: hp(1.7),
    lineHeight: hp(2.2),
  },
  mediaButton: {
    padding: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  
  uploadProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  uploadProgressText: {
    fontSize: hp(1),
    color: '#8089ff',
    marginTop: 2,
  },
  otherMessageText: {
    color: '#333',
    fontSize: hp(1.7),
    lineHeight: hp(2.2),
  },
  messageImage: {
    width: wp(60),
    height: wp(60),
    borderRadius: hp(1.5),
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfo: {
    marginLeft: wp(2),
    flex: 1,
  },
  fileName: {
    fontSize: hp(1.6),
    color: '#333',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: hp(1.3),
    color: '#666',
    marginTop: hp(0.3),
  },
  editedText: {
    fontSize: hp(1.2),
    color: '#ccc',
    marginTop: hp(0.5),
    fontStyle: 'italic',
    alignSelf: 'flex-end',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  ownMessageFooter: {
    justifyContent: 'flex-end',
  },
  otherMessageFooter: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: hp(1.2),
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(1),
  },
  readCount: {
    fontSize: hp(1.1),
    color: '#4CAF50',
    marginLeft: wp(0.5),
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: hp(1),
    paddingHorizontal: wp(2),
  },
  replyLine: {
    width: 3,
    height: '100%',
    backgroundColor: '#8089ff',
    marginRight: wp(2),
    borderRadius: 1.5,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: '#8089ff',
  },
  replyText: {
    fontSize: hp(1.4),
    color: '#666',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(0.5),
  },
  reactionBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: 15,
    marginRight: wp(1),
    marginBottom: hp(0.5),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: wp(8),
    alignItems: 'center',
  },
  ownReactionBadge: {
    backgroundColor: 'rgba(128,137,255,0.2)',
    borderColor: '#8089ff',
  },
  reactionEmojiText: {
    fontSize: hp(1.8),
  },
  typingIndicatorContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  typingIndicatorBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: wp(80),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: wp(2),
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 1,
  },
  typingDotMiddle: {
    opacity: 0.7,
  },
  typingText: {
    fontSize: hp(1.4),
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachButton: {
    padding: wp(2),
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.7),
    maxHeight: hp(15),
    marginHorizontal: wp(2),
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
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewName: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: '#8089ff',
  },
  replyPreviewText: {
    fontSize: hp(1.4),
    color: '#666',
  },
  replyPreviewClose: {
    fontSize: hp(2),
    color: '#999',
    padding: wp(2),
  },
  editPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff8e1',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  editPreviewText: {
    fontSize: hp(1.4),
    color: '#856404',
    fontWeight: '500',
  },
  editPreviewClose: {
    fontSize: hp(1.4),
    color: '#856404',
  },
   headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  reactionPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPicker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: wp(4),
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: wp(75),
    justifyContent: 'center',
  },
  reactionEmoji: {
    padding: wp(3),
  },
  messageMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  messageMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: hp(2),
  },
  messageMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
  },
  messageMenuText: {
    fontSize: hp(1.8),
    color: '#333',
    marginLeft: wp(3),
  },
  videoContainer: {
  position: 'relative',
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#000',
},

videoThumbnail: {
  width: wp(60),
  height: wp(40),
  opacity: 0.8,
},

videoPlaceholder: {
  width: wp(60),
  height: wp(40),
  backgroundColor: '#333',
  justifyContent: 'center',
  alignItems: 'center',
},

videoOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.3)',
},

videoInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: wp(2),
  paddingVertical: hp(1),
  backgroundColor: 'rgba(255,255,255,0.9)',
},

videoDuration: {
  fontSize: hp(1.2),
  color: '#666',
  marginLeft: wp(1),
},

audioContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f0f4ff',
  borderRadius: 25,
  padding: wp(3),
  width: wp(60),
},

audioPlayButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#8089ff',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: wp(3),
},

audioInfo: {
  flex: 1,
},

audioTitle: {
  fontSize: hp(1.6),
  fontWeight: '500',
  color: '#333',
},

audioDuration: {
  fontSize: hp(1.2),
  color: '#666',
  marginTop: hp(0.3),
},
videoPlaceholderIcon: {
  fontSize: hp(4),
  marginBottom: hp(1),
},

videoPlaceholderText: {
  fontSize: hp(1.6),
  color: '#fff',
  fontWeight: '500',
},

videoFileName: {
  fontSize: hp(1.4),
  color: '#333',
  fontWeight: '500',
  flex: 1,
},
});