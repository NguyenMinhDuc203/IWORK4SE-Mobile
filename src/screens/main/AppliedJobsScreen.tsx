import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/api';
import { Application } from '../../types/api';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;

const AppliedJobsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('Tất cả');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    if (!user?.userId) return;

    setIsLoading(true);
    try {
      const response = await api.getApplicationsByApplicant(user.userId, 0, 100);
      if (response.data?.content) {
        setApplications(response.data.content);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const handleWithdraw = async (applicationId: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn hủy đơn ứng tuyển này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await api.withdrawApplication(applicationId);
              setApplications((prev) => prev.filter((app) => app.id !== applicationId));
              Alert.alert('Thành công', 'Đã hủy đơn ứng tuyển');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể hủy đơn ứng tuyển');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '#10b981';
      case 'REJECTED':
        return '#ef4444';
      case 'VIEWED':
        return '#3b82f6';
      default:
        return '#f59e0b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ phản hồi';
      case 'VIEWED':
        return 'Đã xem';
      case 'APPROVED':
        return 'Được chấp nhận';
      case 'REJECTED':
        return 'Bị từ chối';
      case 'WITHDRAWN':
        return 'Đã rút đơn';
      default:
        return status;
    }
  };

  const filteredApplications =
    filter === 'Tất cả'
      ? applications
      : applications.filter((app) => {
          if (filter === 'Được chấp nhận') return app.status === 'APPROVED';
          if (filter === 'Bị từ chối') return app.status === 'REJECTED';
          if (filter === 'Chờ phản hồi') return app.status === 'PENDING';
          return true;
        });

  const renderApplicationItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      style={styles.applicationCard}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.jobId })}
    >
      <View style={styles.applicationHeader}>
        {item.logoUrl ? (
          <Image
            source={{ uri: item.logoUrl }}
            style={styles.companyLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business-outline" size={24} color="#9ca3af" />
          </View>
        )}
        <View style={styles.applicationInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.jobTitle}
          </Text>
          <Text style={styles.companyName}>{item.companyName}</Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.applicationDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={14} color="#666" />
          <Text style={styles.detailText}>
            {(item.minSalary / 1000000).toFixed(1)} - {(item.maxSalary / 1000000).toFixed(1)} triệu
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.appliedDate).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      {item.status === 'PENDING' && (
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() => handleWithdraw(item.id)}
        >
          <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
          <Text style={styles.withdrawButtonText}>Hủy đơn</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {['Tất cả', 'Chờ phản hồi', 'Được chấp nhận', 'Bị từ chối'].map((filterItem) => (
            <TouchableOpacity
              key={filterItem}
              style={[styles.filterButton, filter === filterItem && styles.filterButtonActive]}
              onPress={() => setFilter(filterItem)}
            >
              <Text
                style={[styles.filterText, filter === filterItem && styles.filterTextActive]}
              >
                {filterItem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e7efc" />
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          renderItem={renderApplicationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có đơn ứng tuyển nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1e7efc',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f9f9f9',
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicationInfo: {
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicationDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 4,
  },
  withdrawButtonText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 16,
  },
});

export default AppliedJobsScreen;

