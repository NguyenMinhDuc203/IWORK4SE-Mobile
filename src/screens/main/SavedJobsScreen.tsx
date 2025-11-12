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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/api';
import { SavedJob } from '../../types/api';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;

const SavedJobsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    if (!user?.userId) {
      setSavedJobs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.getSavedJobsByApplicant({ applicantId: user.userId, page: 0, size: 100 });
      if (response.data?.content) {
        setSavedJobs(response.data.content);
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSavedJobs();
  };

  const handleUnsave = async (savedJobId: string, jobId: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn bỏ lưu việc làm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await api.toggleSaveJob(jobId);
              setSavedJobs((prev) => prev.filter((job) => job.id !== savedJobId));
              Alert.alert('Thành công', 'Đã bỏ lưu việc làm');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể bỏ lưu việc làm');
            }
          },
        },
      ]
    );
  };

  const formatSalary = (min: number, max: number) => {
    if (min && max) {
      return `${(min / 1000000).toFixed(1)} - ${(max / 1000000).toFixed(1)} triệu VNĐ`;
    }
    return 'Thỏa thuận';
  };

  const renderSavedJobItem = ({ item }: { item: SavedJob }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.jobId })}
    >
      <View style={styles.jobHeader}>
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
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.jobTitle}
          </Text>
          <Text style={styles.companyName}>{item.companyName}</Text>
        </View>
        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsave(item.id, item.jobId)}
        >
          <Ionicons name="bookmark" size={24} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.jobLocation}</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{formatSalary(item.minSalary, item.maxSalary)}</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.detailText}>
            Hạn nộp: {new Date(item.closingDate).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      <View style={styles.jobActions}>
        <Text style={styles.savedDate}>
          Đã lưu: {new Date(item.savedDate).toLocaleDateString('vi-VN')}
        </Text>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => navigation.navigate('JobDetail', { jobId: item.jobId })}
        >
          <Text style={styles.applyButtonText}>Ứng tuyển</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e7efc" />
        </View>
      ) : (
        <FlatList
          data={savedJobs}
          renderItem={renderSavedJobItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có việc làm nào được lưu</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Jobs')}
              >
                <Text style={styles.emptyButtonText}>Tìm việc làm</Text>
              </TouchableOpacity>
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
  listContent: {
    padding: 16,
  },
  jobCard: {
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
  jobHeader: {
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
  jobInfo: {
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
  unsaveButton: {
    padding: 4,
  },
  jobDetails: {
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
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  savedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  applyButton: {
    backgroundColor: '#1e7efc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
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
});

export default SavedJobsScreen;

