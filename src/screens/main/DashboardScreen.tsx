import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/api';
import { Application, JobPost } from '../../types/api';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;

const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.userId) return;

    try {
      const [applicationsRes, savedJobsRes] = await Promise.all([
        api.getApplicationsByApplicant(user.userId, 0, 5),
        api.getSavedJobsByApplicant({ applicantId: user.userId, page: 0, size: 1 }),
      ]);

      if (applicationsRes.data?.content) {
        setApplications(applicationsRes.data.content);
      }
      if (savedJobsRes.data?.totalElements) {
        setSavedJobsCount(savedJobsRes.data.totalElements);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e7efc" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user?.fullName || 'Ứng viên'}!</Text>
        <Text style={styles.subtitle}>Theo dõi tiến trình tìm việc của bạn</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={24} color="#3b82f6" />
          <Text style={styles.statNumber}>{applications.length}</Text>
          <Text style={styles.statLabel}>Đơn ứng tuyển</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={styles.statNumber}>
            {applications.filter((app) => app.status === 'APPROVED').length}
          </Text>
          <Text style={styles.statLabel}>Được chấp nhận</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="bookmark" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>{savedJobsCount}</Text>
          <Text style={styles.statLabel}>Việc đã lưu</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn ứng tuyển gần đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AppliedJobs')}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {applications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có đơn ứng tuyển nào</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Jobs')}
            >
              <Text style={styles.emptyButtonText}>Tìm việc làm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          applications.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.applicationCard}
              onPress={() => navigation.navigate('JobDetail', { jobId: app.jobId })}
            >
              <View style={styles.applicationHeader}>
                <Text style={styles.jobTitle}>{app.jobTitle}</Text>
                <View
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '20' }]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                    {getStatusText(app.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.companyName}>{app.companyName}</Text>
              <Text style={styles.applicationDate}>
                Ứng tuyển: {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Jobs')}
        >
          <Ionicons name="search" size={24} color="#1e7efc" />
          <Text style={styles.quickActionText}>Tìm việc làm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person" size={24} color="#1e7efc" />
          <Text style={styles.quickActionText}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: '#1e7efc',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#1e7efc',
    fontWeight: '600',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
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
  companyName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#1e7efc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
});

export default DashboardScreen;

