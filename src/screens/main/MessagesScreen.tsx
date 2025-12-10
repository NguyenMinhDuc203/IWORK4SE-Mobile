import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/api';
import { Conversation } from '../../types/api';
import { MainStackParamList, MainTabParamList } from '../../navigation/AppNavigator';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;

const MessagesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    if (!user?.userId) return;
    setIsLoading(true);
    try {
      const res = await api.getConversations(0, 50);
      setConversations(res.content || []);
    } catch (error) {
      console.error('Error loading conversations', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const getCounterpart = (c: Conversation) => {
    if (!user?.userId) return { id: '', name: '' };
    return c.user1Id === user.userId
      ? { id: c.user2Id, name: c.user2Name }
      : { id: c.user1Id, name: c.user1Name };
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const counterpart = getCounterpart(item);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            receiverId: counterpart.id,
            receiverName: counterpart.name,
          })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.counterpartName}>{counterpart.name || 'Người dùng'}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardFooter}>
          <Ionicons name="time-outline" size={16} color="#9ca3af" />
          <Text style={styles.metaText}>
            {item.lastMessageTime
              ? new Date(item.lastMessageTime).toLocaleString('vi-VN')
              : 'Chưa có tin nhắn'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e7efc" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={conversations}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>Chưa có cuộc trò chuyện</Text>
          <Text style={styles.emptySubtext}>Hãy nhắn tin với nhà tuyển dụng hoặc ứng viên.</Text>
        </View>
      }
      contentContainerStyle={conversations.length === 0 ? styles.emptyContent : undefined}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterpartName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  unreadBadge: {
    minWidth: 24,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    color: '#6b7280',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default MessagesScreen;

