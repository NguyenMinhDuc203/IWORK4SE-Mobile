import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../api/api';
import { NotificationItem } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { STORAGE_KEYS, WS_BASE_URL } from '../../constants/config';

const typeIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  APPLICATION_STATUS: 'checkmark-done',
  JOB_POST_STATUS: 'briefcase',
  USER_STATUS: 'person',
  JOB_MATCH: 'sparkles',
  SYSTEM: 'notifications',
};

const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (!user?.userId) return;
      try {
        if (reset) {
          setIsRefreshing(true);
          setPage(0);
        } else {
          setIsLoading(true);
        }
        const currentPage = reset ? 0 : page;
        const response = await api.getNotificationsByUser(user.userId, currentPage, 20);
        const pageData = response.data;
        const items = pageData?.content ?? [];

        setNotifications(prev => (reset ? items : [...prev, ...items]));
        setHasMore(currentPage + 1 < (pageData?.totalPages ?? 0));
        if (reset) {
          setPage(1);
        } else {
          setPage(currentPage + 1);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.userId, page],
  );

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.userId || !user.userType) return;

    const connectWebSocket = async () => {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const wsUrl = `${WS_BASE_URL}/ws-notification`;

      clientRef.current = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 5000,
        onConnect: () => {
          const role = user.userType.toLowerCase();
          const destination = `/topic/notifications/${role}/${user.userId}`;
          clientRef.current?.subscribe(destination, message => {
            try {
              const payload = JSON.parse(message.body);
              const mapped = normalizeNotification(payload);
              setNotifications(prev => [mapped, ...prev]);
            } catch (error) {
              console.error('Error parsing notification payload:', error);
            }
          });
        },
        debug: str => console.log('[WS]', str),
      });

      clientRef.current.activate();
    };

    connectWebSocket();

    return () => {
      clientRef.current?.deactivate();
    };
  }, [user?.userId, user?.userType]);

  const normalizeNotification = (payload: Partial<NotificationItem>): NotificationItem => ({
    id: payload.id || String(Date.now()),
    userId: payload.userId || user?.userId || '',
    userName: payload.userName || '',
    applicationId: payload.applicationId ?? null,
    jobPostId: payload.jobPostId ?? null,
    type: payload.type || 'SYSTEM',
    message: payload.message || '',
    isRead: payload.isRead ?? false,
    createdAt: payload.createdAt || new Date().toISOString(),
  });

  const handleRefresh = () => fetchNotifications(true);

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    fetchNotifications();
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const iconName = typeIconMap[item.type] || 'notifications';
    return (
      <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color="#1e7efc" />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationType}>{mapTypeLabel(item.type)}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationDate}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading && !isRefreshing && notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e7efc" />
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
        </View>
      }
    />
  );
};

const mapTypeLabel = (type: string) => {
  switch (type) {
    case 'APPLICATION_STATUS':
      return 'Trạng thái ứng tuyển';
    case 'JOB_POST_STATUS':
      return 'Trạng thái tin tuyển dụng';
    case 'USER_STATUS':
      return 'Trạng thái tài khoản';
    case 'JOB_MATCH':
      return 'Cơ hội phù hợp';
    default:
      return 'Thông báo';
  }
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    backgroundColor: '#f8fafc',
    minHeight: '100%',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unreadCard: {
    borderColor: '#1e7efc',
    backgroundColor: '#f0f7ff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 6,
  },
  notificationDate: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 16,
  },
});

export default NotificationsScreen;


