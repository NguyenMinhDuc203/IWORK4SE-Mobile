import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/api';
import { JobPost, CV } from '../../types/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/config';

type JobDetailRouteProp = RouteProp<MainStackParamList, 'JobDetail'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const JobDetailScreen = () => {
  const route = useRoute<JobDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId } = route.params;
  const { user } = useAuth();
  const [job, setJob] = useState<JobPost | null>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadJobDetails();
    loadCVs();
    checkSavedStatus();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const response = await api.getJobById(jobId);
      setJob(response.data);
    } catch (error) {
      console.error('Error loading job details:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin việc làm');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCVs = async () => {
    if (!user?.userId) return;

    try {
      const response = await api.getCVsByApplicant(user.userId, 0, 100);
      if (response.data?.content) {
        setCvs(response.data.content);
        if (response.data.content.length > 0) {
          setSelectedCvId(response.data.content[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading CVs:', error);
    }
  };

  const checkSavedStatus = async () => {
    // This would require an API endpoint to check if job is saved
    // For now, we'll skip this
  };

  const handleApply = async () => {
    if (!user?.userId) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển');
      return;
    }

    if (!selectedCvId) {
      Alert.alert('Lỗi', 'Vui lòng chọn CV để ứng tuyển');
      return;
    }

    setIsApplying(true);
    try {
      await api.createApplication({
        jobId,
        cvId: selectedCvId,
        applicantId: user.userId,
      });
      Alert.alert('Thành công', 'Ứng tuyển thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể ứng tuyển. Vui lòng thử lại.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveJob = async () => {
    if (!user?.userId) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để lưu việc làm');
      return;
    }

    try {
      await api.toggleSaveJob(jobId);
      setIsSaved(!isSaved);
      Alert.alert('Thành công', isSaved ? 'Đã bỏ lưu việc làm' : 'Đã lưu việc làm');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu việc làm');
    }
  };

  const formatSalary = (min: number, max: number) => {
    if (min && max) {
      return `${(min / 1000000).toFixed(1)} - ${(max / 1000000).toFixed(1)} triệu VNĐ`;
    }
    return 'Thỏa thuận';
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e7efc" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text>Không tìm thấy việc làm</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.jobHeader}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.companyName}>{job.companyName || job.employerName}</Text>
        </View>

        <View style={styles.jobInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{job.location}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{formatSalary(job.minSalary, job.maxSalary)}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="briefcase-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{job.jobType}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.infoText}>
              Hạn nộp: {new Date(job.closingDate).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả công việc</Text>
          <Text style={styles.sectionContent}>{job.description}</Text>
        </View>

        {job.jobPosition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vị trí công việc</Text>
            <Text style={styles.sectionContent}>{job.jobPosition}</Text>
          </View>
        )}

        {job.experience && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kinh nghiệm yêu cầu</Text>
            <Text style={styles.sectionContent}>{job.experience}</Text>
          </View>
        )}
      </View>

      {cvs.length > 0 && (
        <View style={styles.cvSection}>
          <Text style={styles.sectionTitle}>Chọn CV ứng tuyển</Text>
          {cvs.map((cv) => {
            const displayName =
              cv.fileName ||
              (cv.url ? cv.url.split('/').filter(Boolean).pop() : '') ||
              cv.id;

            return (
              <TouchableOpacity
                key={cv.id}
                style={[styles.cvItem, selectedCvId === cv.id && styles.cvItemSelected]}
                onPress={() => setSelectedCvId(cv.id)}
              >
                <Ionicons
                  name={selectedCvId === cv.id ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedCvId === cv.id ? '#1e7efc' : '#666'}
                />
                <View style={styles.cvInfo}>
                  <Text style={styles.cvName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {cv.url ? (
                    <TouchableOpacity
                      style={styles.cvViewButton}
                      onPress={() => Linking.openURL(cv.url)}
                    >
                      <Ionicons name="document-text-outline" size={16} color="#1e7efc" />
                      <Text style={styles.cvViewText}>Xem</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSaveJob}
        >
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color="#1e7efc" />
          <Text style={styles.saveButtonText}>{isSaved ? 'Đã lưu' : 'Lưu việc làm'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.applyButton, isApplying && styles.buttonDisabled]}
          onPress={handleApply}
          disabled={isApplying}
        >
          {isApplying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.applyButtonText}>Ứng tuyển ngay</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  jobHeader: {
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 16,
    color: '#6b7280',
  },
  jobInfo: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  cvSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  cvItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  cvItemSelected: {
    backgroundColor: '#e0e7ff',
  },
  cvInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
    gap: 12,
  },
  cvName: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  cvViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e8f1ff',
  },
  cvViewText: {
    fontSize: 12,
    color: '#1e7efc',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#1e7efc',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e7efc',
  },
  applyButton: {
    backgroundColor: '#1e7efc',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default JobDetailScreen;

