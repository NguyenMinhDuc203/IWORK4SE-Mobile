import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from '../../navigation/AppNavigator';
import { api } from '../../api/api';
import { JobPost } from '../../types/api';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;

const JobsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    jobType: '',
    categoryId: '',
  });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadJobs();
  }, [page, filters]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        keywords: searchKeyword || undefined,
        location: filters.location || undefined,
        jobType: filters.jobType || undefined,
        jobStatus: 'ACCEPTED',
        page,
        size: 10,
      };

      if (filters.categoryId) {
        params.categoryId = parseInt(filters.categoryId);
      }

      const response = await api.searchJobPosts(params);
      if (response && response.content) {
        if (page === 0) {
          setJobs(response.content);
        } else {
          setJobs((prev) => [...prev, ...response.content]);
        }
        setTotalPages(response.totalPages ?? 0);
      } else {
        if (page === 0) {
          setJobs([]);
          setTotalPages(0);
        }
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    loadJobs();
  };

  const handleSearch = () => {
    setPage(0);
    loadJobs();
  };

  const formatSalary = (min: number, max: number) => {
    if (min && max) {
      return `${(min / 1000000).toFixed(1)} - ${(max / 1000000).toFixed(1)} triệu VNĐ`;
    }
    return 'Thỏa thuận';
  };

  const renderJobItem = ({ item }: { item: JobPost }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
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
            {item.title}
          </Text>
          <Text style={styles.companyName}>{item.companyName || item.employerName}</Text>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{formatSalary(item.minSalary, item.maxSalary)}</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="briefcase-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.jobType}</Text>
        </View>
      </View>

      <Text style={styles.postedDate}>
        Đăng ngày: {new Date(item.postedDate).toLocaleDateString('vi-VN')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm việc làm, công ty..."
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="arrow-forward" size={20} color="#1e7efc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color="#1e7efc" />
          <Text style={styles.filterText}>Bộ lọc</Text>
        </TouchableOpacity>
      </View>

      {isLoading && page === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e7efc" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={() => {
            if (page < totalPages - 1 && !isLoading) {
              setPage(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Không tìm thấy việc làm nào</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterContent}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Địa điểm</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Nhập địa điểm"
                  value={filters.location}
                  onChangeText={(text) => setFilters({ ...filters, location: text })}
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Loại việc làm</Text>
                <View style={styles.filterOptions}>
                  {['INTERNSHIP', 'FRESHER', 'JUNIOR', 'SENIOR', 'MANAGER'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        filters.jobType === type && styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          jobType: filters.jobType === type ? '' : type,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.jobType === type && styles.filterOptionTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setFilters({ location: '', jobType: '', categoryId: '' });
                  setPage(0);
                }}
              >
                <Text style={styles.resetButtonText}>Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setShowFilters(false);
                  setPage(0);
                  loadJobs();
                }}
              >
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  filterText: {
    marginLeft: 4,
    color: '#1e7efc',
    fontSize: 14,
    fontWeight: '600',
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
  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  postedDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  filterContent: {
    padding: 16,
  },
  filterItem: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  filterOptionActive: {
    backgroundColor: '#1e7efc',
    borderColor: '#1e7efc',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1e7efc',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default JobsScreen;

