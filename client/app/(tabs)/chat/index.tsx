// app/(tabs)/chat/index.tsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChat } from '@/context/ChatContext';
import { useUser } from '@/Hooks/userHooks.d';
import { ChatListItemProps, ChatRoom } from '@/types/chat';
import { format } from 'date-fns';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

// ============================================
// COMPONENTS
// ============================================

// 1. AI Chat Item Component
interface AIChatItemProps {
  onPress: () => void;
}

const AIChatItem: React.FC<AIChatItemProps> = React.memo(({ onPress }) => {
  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
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
            AI Health Assistant
          </Text>
          <Text style={styles.aiStatus}>Online</Text>
        </View>
        
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            How can I help with your health concerns today?
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

AIChatItem.displayName = 'AIChatItem';

// 2. Regular Chat Item Component
const ChatListItem: React.FC<ChatListItemProps> = React.memo(({ chat, onPress }) => {
  const { user } = useUser();
  const otherParticipant = chat.participantsData?.find((p: any) => {
    // Check if p is defined
    if (!p) return false;
    
    // Safely access _id with optional chaining and nullish coalescing
    const participantId = p._id?.toString() || '';
    const userIdStr = user?._id?.toString() || '';
    
    return participantId !== userIdStr;
  });

  const getDisplayName = () => {
    if (chat.isGroup) {
      return chat.groupName || 'Group Chat';
    }
    return otherParticipant?.name || 'Unknown User';
  };

  const getLastMessageText = () => {
    if (chat.lastMessageData && typeof chat.lastMessageData === 'object') {
      const message = chat.lastMessageData;
      
      if (message.messageType === 'text' && message.content) {
        return message.content.length > 30 
          ? message.content.substring(0, 30) + '...' 
          : message.content;
      }
      
      switch (message.messageType) {
        case 'image': return '📷 Image';
        case 'file': return `📎 ${message.fileName || 'File'}`;
        case 'audio': return '🎤 Audio message';
        case 'video': return '🎬 Video';
        default: return message.content || 'Message';
      }
    }
    
    if (chat.lastMessage && typeof chat.lastMessage === 'string') {
      if (chat.lastMessage.length === 24) {
        return 'Message...';
      }
      return chat.lastMessage.length > 30 
        ? chat.lastMessage.substring(0, 30) + '...' 
        : chat.lastMessage;
    }
    
    return 'Start a conversation...';
  };

  const getUnreadCount = () => {
    return chat.unreadCount[user?._id || ''] || 0;
  };

  const formatTime = (date?: string | Date) => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return format(dateObj, 'HH:mm');
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return format(dateObj, 'EEE');
      } else {
        return format(dateObj, 'dd/MM');
      }
    } catch {
      return '';
    }
  };

  const unreadCount = getUnreadCount();
  const displayName = getDisplayName();

  return (
    <TouchableOpacity style={styles.chatItem} onPress={() => onPress(chat)}>
      <View style={styles.avatarContainer}>
        {chat.isGroup ? (
          <View style={styles.groupAvatar}>
            <Text style={styles.groupAvatarText}>
              {displayName.charAt(0).toUpperCase()}
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
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {!chat.isGroup && otherParticipant?.isOnline && (
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
          </View>
        )}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {displayName}
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
});

ChatListItem.displayName = 'ChatListItem';

// 3. Search Bar Component
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = React.memo(({ value, onChangeText }) => {
  return (
    <View style={styles.searchContainer}>
      <Feather name="search" size={20} color="#999" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search messages..."
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
        clearButtonMode="while-editing"
      />
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

// 4. Header Component
interface HeaderProps {
  unreadCount: number;
}

const Header: React.FC<HeaderProps> = React.memo(({ unreadCount }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Messages</Text>
      {unreadCount > 0 && (
        <View style={styles.totalUnreadBadge}>
          <Text style={styles.totalUnreadCount}>{unreadCount}</Text>
        </View>
      )}
    </View>
  );
});

Header.displayName = 'Header';

// 5. Empty State Component
const EmptyState: React.FC = React.memo(() => {
  return (
    <View style={styles.emptyContainer}>
      <Feather name="message-circle" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No conversations yet</Text>
      <Text style={styles.emptySubtext}>
        Start a new conversation by messaging a professional
      </Text>
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

// 6. Loading State Component
const LoadingState: React.FC = React.memo(() => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#8089ff" />
    </View>
  );
});

LoadingState.displayName = 'LoadingState';

// ============================================
// MAIN CHAT LIST SCREEN
// ============================================

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useUser();
  const {
    chats,
    loading,
    unreadCount,
    loadChats,
    setActiveChat,
    hasMoreMessages,
    loadMessages,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const isMountedRef = useRef(true);

  // Initialize
  useEffect(() => {
    isMountedRef.current = true;
    
    const initialize = async () => {
      if (isMountedRef.current) {
        await loadChats();
      }
    };
    
    initialize();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Prepare chat list with AI chat first
  const chatList = useMemo(() => {
    const sortedChats = [...chats].sort((a, b) => {
      const dateA = a.lastMessageAt || a.updatedAt || a.createdAt || new Date(0);
      const dateB = b.lastMessageAt || b.updatedAt || b.createdAt || new Date(0);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    return sortedChats;
  }, [chats]);

  // Filter chats based on search
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatList;
    
    const searchLower = searchQuery.toLowerCase().trim();
    
    return chatList.filter(chat => {
      if (chat.isGroup) {
        return chat.groupName?.toLowerCase().includes(searchLower) ||
               chat.groupDescription?.toLowerCase().includes(searchLower);
      } else {
        const otherParticipant = chat.participantsData?.find((p: any) => {
          const participantId = typeof p._id === 'object' ? p._id.toString() : p._id;
          const userIdStr = user?._id?.toString();
          return participantId !== userIdStr;
        });
        
        const participantMatch = otherParticipant?.name.toLowerCase().includes(searchLower);
        const lastMessageMatch = chat.lastMessageData?.content?.toLowerCase().includes(searchLower);
        
        return participantMatch || lastMessageMatch;
      }
    });
  }, [chatList, searchQuery, user?._id]);

  // Add AI chat to the beginning if not searching
  const displayList = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredChats;
    }
    return filteredChats;
    // If you want AI chat at the top, add it here:
    // return [aiChat, ...filteredChats];
  }, [filteredChats, searchQuery]);

  // Handle chat press
  const handleChatPress = useCallback((chat: ChatRoom) => {
    if (chat._id === 'ai-chat') {
      router.push('/messages/ai');
    } else {
      setActiveChat(chat);
      router.push(`/messages/${chat._id}`);
    }
  }, [router, setActiveChat]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    if (!refreshing) {
      setRefreshing(true);
      try {
        await loadChats();
      } catch (error) {
        console.error('Failed to refresh chats:', error);
      } finally {
        if (isMountedRef.current) {
          setRefreshing(false);
        }
      }
    }
  }, [loadChats, refreshing]);

  // Load more messages
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreMessages || refreshing) return;
    
    setLoadingMore(true);
    try {
      // Assuming you have a way to load more chats
      // This would depend on your pagination implementation
      // For now, we'll just reload chats
      await loadChats();
    } catch (error) {
      console.error('Failed to load more chats:', error);
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [loadingMore, hasMoreMessages, refreshing, loadChats]);

  // Render each chat item
  const renderChatItem = useCallback(({ item }: { item: ChatRoom }) => {
    if (item._id === 'ai-chat') {
      return <AIChatItem onPress={() => handleChatPress(item)} />;
    }
    return <ChatListItem chat={item} onPress={handleChatPress} unreadCount={item.unreadCount[user?._id || ''] || 0 }/>;
  }, [handleChatPress, user?._id]);

  // Render footer with loading indicator
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#8089ff" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  }, [loadingMore]);

  // Render AI chat as a separate section
  const renderHeader = useCallback(() => {
    if (searchQuery.trim()) return null;
    
    return (
      <>
        <TouchableOpacity 
          style={styles.chatItem} 
          onPress={() => router.push('/messages/ai')}
        >
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
                AI Health Assistant
              </Text>
              <Text style={styles.aiStatus}>Online</Text>
            </View>
            
            <View style={styles.chatFooter}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                How can I help with your health concerns today?
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Conversations</Text>
        </View>
      </>
    );
  }, [searchQuery, router]);

  if (loading && chats.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header unreadCount={unreadCount} />
      
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <FlatList
        ref={flatListRef}
        data={displayList}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8089ff']}
            tintColor="#8089ff"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!refreshing ? <EmptyState /> : null}
        contentContainerStyle={[
          styles.listContent,
          displayList.length === 0 && styles.emptyListContent,
        ]}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

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
    paddingVertical: hp(1.5),
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: hp(1.7),
    color: '#333',
    padding: 0,
  },
  listContent: {
    paddingBottom: hp(2),
  },
  emptyListContent: {
    flex: 1,
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
    padding: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
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
    marginLeft: wp(2),
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
    marginLeft: wp(2),
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
    paddingVertical: hp(20),
  },
  emptyText: {
    fontSize: hp(2),
    color: '#666',
    fontWeight: '500',
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptySubtext: {
    fontSize: hp(1.5),
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  footerText: {
    marginLeft: wp(2),
    fontSize: hp(1.4),
    color: '#8089ff',
  },
  sectionHeader: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});