// app/(tabs)/chat/index.ts
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChat } from '@/context/ChatContext';
import { ChatListItemProps } from '@/types/chat';
import { format } from 'date-fns';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

// Icons
import SearchIcon from '@/assets/Svgs/search.svg';
import OnlineDot from '@/assets/Svgs/droplet.svg';
import { useUser } from '@/Hooks/userHooks.d';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';



const ChatListItem: React.FC<ChatListItemProps>  = ({ chat, onPress, messages = [] }) => {
  const { user } = useUser();
  const otherParticipant = chat.participantsData?.find(p => p._id !== user?._id);
  
  
  const getDisplayName = () => {
    if (chat.isGroup) {
      return chat.groupName || 'Group Chat';
    }
    return otherParticipant?.name || 'Unknown User';
  };
  

  const getLastMessageText = () => {
  // Priority 1: lastMessageData (populated message object)
  if (chat.lastMessageData && typeof chat.lastMessageData === 'object') {
    const message = chat.lastMessageData;
    
    if (message.messageType === 'text' && message.content) {
      return message.content.length > 30 
        ? message.content.substring(0, 30) + '...' 
        : message.content;
    }
    
    // Handle media messages
    switch (message.messageType) {
      case 'image':
        return '📷 Image';
      case 'file':
        return `📎 ${message.fileName || 'File'}`;
      case 'audio':
        return '🎤 Audio message';
      case 'video':
        return '🎬 Video';
      default:
        return message.content || 'Message';
    }
  }
  
  // Priority 2: lastMessage (could be ObjectId or string)
  if (chat.lastMessage) {
    // If it's an ObjectId string, show placeholder
    if (typeof chat.lastMessage === 'string' && chat.lastMessage.length === 24) {
      return 'Message...'; // It's an ObjectId, not actual content
    }
    
    // If it's a string message (old data), use it
    if (typeof chat.lastMessage === 'string') {
      return chat.lastMessage.length > 30 
        ? chat.lastMessage.substring(0, 30) + '...' 
        : chat.lastMessage;
    }
  }
  
  // Default
  return 'Start a conversation...';
};

  const getUnreadCount = () => {
    return chat.unreadCount[user?._id || ''] || 0;
  };

  const formatTime = (date?: string | Date) => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      // Check if date is valid
      if (isNaN(dateObj.getTime())) return '';
      
      // Format for today/yesterday/recent
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Today - show time
        return format(dateObj, 'HH:mm');
      } else if (diffDays === 1) {
        // Yesterday
        return 'Yesterday';
      } else if (diffDays < 7) {
        // Within a week - show day name
        return format(dateObj, 'EEE');
      } else {
        // Older than a week - show date
        return format(dateObj, 'dd/MM');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const unreadCount = getUnreadCount();

  return (
    <TouchableOpacity style={styles.chatItem} onPress={() => onPress(chat)}>
      <View style={styles.avatarContainer}>
        {chat.isGroup ? (
          <View style={styles.groupAvatar}>
            <Text style={styles.groupAvatarText}>
              {getDisplayName().charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : otherParticipant?.profile?.avatar ? (
          <Image
            source={{ uri: otherParticipant.profile.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {getDisplayName().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Online indicator for one-on-one chats */}
        {!chat.isGroup && otherParticipant?.isOnline && (
          <View style={styles.onlineIndicator}>
            <OnlineDot width={12} height={12} />
          </View>
        )}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {getDisplayName()}
          </Text>
          <Text style={styles.chatTime}>
            {formatTime(chat.updatedAt || chat.createdAt || chat.lastMessageAt)}
          </Text>
        </View>
        
        <View style={styles.chatFooter}>
          <Text
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.unreadLastMessage,
            ]}
            numberOfLines={1}
          >
            {getLastMessageText()}
          </Text>
          
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useUser();
  const {
    chats,
    loading,
    unreadCount,
    loadChats,
    setActiveChat,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const baseChatList = useMemo(() => {
    // 1. Add AI chat
    const aiChat: any = {
      _id: 'ai-chat',
      isAI: true,
      name: 'AI Health Assistant',
      description: 'Get AI-driven diagnostic advice and recommendations.',
      isOnline: true,
      lastMessage: 'How can I help with your health concerns today?',
      lastMessageAt: new Date(),
      lastMessageData: {
        content: 'How can I help with your health concerns today?',
        createdAt: new Date(),
        messageType: 'text'
      },
      unreadCount: { [user?._id || '']: 0 },
      participantsData: [],
      updatedAt: new Date(),
    };

    // 2. Sort regular chats by lastMessageAt, then updatedAt
    const sortedChats = [...chats].sort((a, b) => {
      const dateA = a.lastMessageAt || a.updatedAt || a.createdAt || new Date(0);
      const dateB = b.lastMessageAt || b.updatedAt || b.createdAt || new Date(0);
      
      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();
      
      return timeB - timeA; // Descending (newest first)
    });

    // 3. Return AI chat first, then sorted chats
    return [aiChat, ...sortedChats];
  }, [chats, user?._id]);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return baseChatList;
    
    const searchLower = searchQuery.toLowerCase().trim();
    
    return baseChatList.filter(chat => {
      if (chat.isAI) {
        // Search in AI chat
        return chat.name.toLowerCase().includes(searchLower) || 
               chat.description.toLowerCase().includes(searchLower) ||
               'ai health assistant artificial intelligence'.includes(searchLower);
      }
      
      // Search in regular chats
      if (chat.isGroup) {
        return chat.groupName?.toLowerCase().includes(searchLower) ||
               chat.groupDescription?.toLowerCase().includes(searchLower);
      } else {
        const otherParticipant = chat.participantsData?.find((p: any) => {
          // Handle both string and ObjectId comparison
          const participantId = typeof p._id === 'object' ? p._id.toString() : p._id;
          const userIdStr = user?._id?.toString();
          return participantId !== userIdStr;
        });
        const participantMatch = otherParticipant?.name.toLowerCase().includes(searchLower);
        
        const lastMessageMatch = chat.lastMessageData?.content?.toLowerCase().includes(searchLower);
        
        return participantMatch || lastMessageMatch;
      }
    });
  }, [baseChatList, searchQuery, user?._id]);

  const handleChatPress = (chat: any) => {
    if (chat.isAI) {
      router.push('/messages/ai');
    } else {
      setActiveChat(chat);
      router.push(`/messages/${chat._id}`);
    }
  };


  const renderChatItem = ({ item }: { item: any }) => {
    if (item.isAI) {
      return (
        <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)}>
          <View style={styles.avatarContainer}>
            <View style={styles.aiAvatar}>
              <Feather name="cpu" size={24} color="#8089ff" />
            </View>
            <View style={styles.aiOnlineIndicator}>
              <View style={styles.aiOnlineDot} />
            </View>
          </View>

          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.aiStatus}>
                Online
              </Text>
            </View>
            
            <View style={styles.chatFooter}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return <ChatListItem 
               chat={item} 
               onPress={handleChatPress} 
               unreadCount={item.unreadCount[user?._id || ''] || 0} 
            />;
  };

  if (loading && chats.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8089ff" />
        </View>
      </SafeAreaView>
    );
  }

  if (loading && chats.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8089ff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {unreadCount > 0 && (
          <View style={styles.totalUnreadBadge}>
            <Text style={styles.totalUnreadCount}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchIcon width={20} height={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats} // Use chatList instead of filteredChats
        renderItem={renderChatItem} // Use your custom renderChatItem function
        keyExtractor={(item) => item._id.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start a new conversation by messaging a professional
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

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
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  aiAvatar: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: 'rgba(128, 137, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8089ff',
  },
  aiOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 2,
  },
  aiOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  aiStatus: {
    fontSize: hp(1.2),
    color: '#4CAF50',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: '#333',
  },
  totalUnreadBadge: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    minWidth: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalUnreadCount: {
    color: '#fff',
    fontSize: hp(1.3),
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginVertical: hp(1),
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.5),
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: hp(1.7),
    color: '#333',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
  },
  avatarPlaceholder: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: '#8089ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: '600',
  },
  groupAvatar: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: '#6f42c1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarText: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 1,
  },
  chatInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  chatName: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  chatTime: {
    fontSize: hp(1.2),
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: hp(1.5),
    color: '#666',
    flex: 1,
  },
  unreadLastMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#8089ff',
    borderRadius: 12,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    minWidth: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: hp(1.2),
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: hp(2),
    color: '#666',
    fontWeight: '500',
    marginBottom: hp(1),
  },
  emptySubtext: {
    fontSize: hp(1.5),
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
  newChatButton: {
    position: 'absolute',
    bottom: hp(3),
    right: wp(4),
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: '#8089ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});