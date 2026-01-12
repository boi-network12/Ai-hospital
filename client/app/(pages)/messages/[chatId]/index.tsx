// app/(pages/messages/[chatId]/index.tsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChat } from '@/context/ChatContext';
import { ChatMessage } from '@/types/chat';
import { format } from 'date-fns';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useUser } from '@/Hooks/userHooks.d';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/Hooks/useToast.d';
import { debounce } from 'lodash';

// Components
interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ visible, onClose, onSelect }) => {
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
};
ReactionPicker.displayName = 'ReactionPicker';

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

const MessageMenu: React.FC<MessageMenuProps> = ({
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
    { id: 'reply', label: 'Reply', icon: <Feather name="corner-up-left" size={20} color="#333" /> },
    { id: 'copy', label: 'Copy', icon: <Feather name="copy" size={20} color="#333" /> },
  ];

  if (isOwnMessage && message) {
    menuItems.push(
      { id: 'edit', label: 'Edit', icon: <Feather name="edit-2" size={20} color="#333" /> },
      { id: 'delete', label: 'Delete', icon: <Feather name="trash-2" size={20} color="#333" /> }
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
              {item.icon}
              <Text style={styles.messageMenuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};
MessageMenu.displayName = 'MessageMenu';

interface MessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onPress: () => void;
  onLongPress: (msg: ChatMessage) => void;
}

const MessageItem = memo(({ message, isOwnMessage, onPress, onLongPress }: MessageItemProps) => {
  const { user } = useUser();

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

  const formatTime = (date: Date | string) => format(new Date(date), 'HH:mm');

  const handleReactionPress = (emoji: string) => {
    // addReaction or removeReaction logic here
  };

  return (
    <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
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

      <TouchableOpacity
        style={[styles.messageBubble, isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble]}
        onPress={onPress}
        onLongPress={() => onLongPress(message)}
        activeOpacity={0.8}
      >
        {message.messageType === 'image' && message.fileUrl ? (
          <Image source={{ uri: message.fileUrl }} style={styles.messageImage} resizeMode="cover" />
        ) : message.messageType === 'file' ? (
          <View style={styles.fileContainer}>
            <Feather name="file" size={24} color="#666" />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {message.fileName || 'File'}
              </Text>
              <Text style={styles.fileSize}>
                {message.fileSize ? (message.fileSize / 1024).toFixed(1) : '0'} KB
              </Text>
            </View>
          </View>
        ) : (
          <Text style={isOwnMessage ? styles.ownMessageText : styles.otherMessageText}>
            {message.content || ''}
          </Text>
        )}

        {message.isEdited && <Text style={styles.editedText}>(edited)</Text>}
      </TouchableOpacity>

      <View style={[styles.messageFooter, isOwnMessage ? styles.ownMessageFooter : styles.otherMessageFooter]}>
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

      {message.reactions && message.reactions.length > 0 && (
        <View style={[styles.reactionsContainer, { justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'}]}>
          {message.reactions.map((reaction, index) => (
            <TouchableOpacity
              key={index}
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

// Main Chat Screen Component
const ChatScreen: React.FC = () => {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { showAlert } = useToast();
  const router = useRouter();
  const { user } = useUser();
  
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
    loadMessagesForChat
  } = useChat();

  // State
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Effects
  useEffect(() => {
    const initializeChat = async () => {
      if (chatId) {
        try {
          console.log('ChatScreen: Initializing chat...');
          
          const chatRoom = await loadChatRoom(chatId);
          
          if (chatRoom) {
            await loadMessagesForChat(chatRoom._id.toString());
          }
        } catch (error) {
          console.error('ChatScreen: Failed to initialize chat:', error);
          showAlert({message: "Failed to load chat", type: "error"})
          router.back();
        }
      }
    };

    initializeChat();

    return () => {
      setActiveChat(null);
    };
  }, [chatId]);

  const handleTextChangeDebounced = useCallback(
    debounce((text: string) => {
      if (activeChat) {
        const isTyping = text.length > 0;
        setTyping(isTyping);
        // Clear typing after 1 second if no further typing
        setTimeout(() => {
          setTyping(false);
        }, 1000);
      }
    }, 300),
    [activeChat, setTyping]
  );

  useEffect(() => {
    const unreadMessages = messages.filter(
      (msg) => !msg.readBy?.includes(user?._id ?? '') && msg.senderId !== user?._id
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        markAsRead(msg._id.toString());
      });
    }
  }, [messages, user?._id, markAsRead]);

  

  // Handlers
 const handleTextChange = useCallback(
    (text: string) => {
      setMessageText(text);
      handleTextChangeDebounced(text);
    },
    [handleTextChangeDebounced]
  );

  const handleSend = useCallback(async () => {
    if (!messageText.trim() && !editingMessage) return;
    
    try {
      if (editingMessage) {
        await editMessage(editingMessage._id.toString(), messageText.trim());
        setEditingMessage(null);
      } else {
        await sendMessage(messageText.trim(), replyTo?._id.toString());
        setReplyTo(null);
      }
      
      setMessageText('');
      setTyping(false);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      showAlert({ message: 'Failed to send message', type: "error" });
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

  const handleDelete = useCallback(
    (message: ChatMessage) => {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete for me', onPress: () => deleteMessage(message._id.toString(), false) },
          { text: 'Delete for everyone', onPress: () => deleteMessage(message._id.toString(), true) },
        ]
      );
    },
    [deleteMessage]
  );

  const handleCopy = useCallback((text: string) => {
    showAlert({message: 'Message copied to clipboard', type: 'success'})
  }, [showAlert]);

  const handleAddReaction = useCallback(
    (emoji: string) => {
      if (selectedMessage) {
        addReaction(selectedMessage._id.toString(), emoji);
      }
    },
    [selectedMessage, addReaction]
  );
  

  // Render Functions
  const renderTypingIndicator = () => {
  if (typingUsers.size === 0) return null;
  
  // Get the names of typing users
  const typingUserNames = Array.from(typingUsers).map(userId => {
    const user = activeChat?.participantsData?.find(p => p._id === userId);
    return user?.name || 'Someone';
  });

  return (
    <View style={styles.typingIndicatorContainer}>
      <View style={styles.typingIndicatorBubble}>
        <View style={styles.typingDots}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, styles.typingDotMiddle]} />
          <View style={styles.typingDot} />
        </View>
        <Text style={styles.typingText}>
          {typingUserNames.length === 1 
            ? `${typingUserNames[0]} is typing...`
            : `${typingUserNames.slice(0, 2).join(', ')} ${typingUserNames.length > 2 ? `and ${typingUserNames.length - 2} more` : ''} are typing...`}
        </Text>
      </View>
    </View>
  );
};


  const renderReplyPreview = () => {
    if (!replyTo) return null;

    return (
      <View style={styles.replyPreview}>
        <View style={styles.replyPreviewContent}>
          <Text style={styles.replyPreviewName}>Replying to {replyTo.sender?.name || 'User'}</Text>
          <Text style={styles.replyPreviewText} numberOfLines={1}>
            {replyTo.content || ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setReplyTo(null)}>
          <Text style={styles.replyPreviewClose}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEditPreview = () => {
    if (!editingMessage) return null;

    return (
      <View style={styles.editPreview}>
        <Text style={styles.editPreviewText}>Editing message</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingMessage(null);
            setMessageText('');
          }}
        >
          <Text style={styles.editPreviewClose}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8089ff" />
        </View>
      </SafeAreaView>
    );
  }

  const otherParticipant = activeChat?.participantsData?.find((p) => p._id !== user?._id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setActiveChat(null);
            router.back();
          }}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {activeChat?.isGroup ? (
            <>
              <Text style={styles.headerTitle}>{activeChat.groupName || 'Group Chat'}</Text>
              <Text style={styles.headerSubtitle}>
                {activeChat.participantsData?.length || 0} members
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.headerTitle}>{otherParticipant?.name || 'Chat'}</Text>
              <Text style={styles.headerSubtitle}>
                {otherParticipant?.isOnline ? 'Online' : 'Offline'}
                {renderTypingIndicator()}
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity>
          <Feather name="more-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

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
              onPress={() => setSelectedMessage(item)}
              onLongPress={handleMessageLongPress}
            />
          )}
          keyExtractor={(item) => item._id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            // Auto-scroll to bottom
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          inverted={false}  // REMOVE inverted if you have it
        />

        {renderReplyPreview()}
        {renderEditPreview()}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Feather name="image" size={24} color="#666" />
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
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
};

ChatScreen.displayName = 'ChatScreen';

export default ChatScreen;

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
  otherMessageText: {
    color: '#333',
    fontSize: hp(1.7),
    lineHeight: hp(2.2),
  },
  messageImage: {
    width: wp(60),
    height: wp(60),
    borderRadius: 12,
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
    color: 'rgba(255,255,255,0.7)',
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
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    backgroundColor: '#fff',
    borderRadius: 20,
    marginTop: hp(1),
    alignSelf: 'flex-start',
    marginLeft: wp(4),
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
  footerContainer: {
    alignItems: 'center',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    borderRadius: 20,
    marginTop: hp(1),
  },
  loadingMoreText: {
    fontSize: hp(1.4),
    color: '#8089ff',
    marginLeft: wp(2),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(20),
  },
  emptyText: {
    fontSize: hp(2),
    color: '#666',
    fontWeight: '600',
    marginBottom: hp(1),
  },
  emptySubtext: {
    fontSize: hp(1.6),
    color: '#999',
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
  typingIndicatorContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    alignItems: 'flex-start',
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
    animationDelay: '0.2s',
  },
  typingText: {
    fontSize: hp(1.4),
    color: '#666',
  },

});