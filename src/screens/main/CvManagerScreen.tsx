import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/api';
import { CV } from '../../types/api';

const CvManagerScreen: React.FC = () => {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadCVs();
  }, []);

  const loadCVs = async () => {
    if (!user?.userId) return;
    setIsLoading(true);
    try {
      const response = await api.getCVsByApplicant(user.userId, 0, 20);
      setCvs(response.data?.content ?? []);
    } catch (error) {
      console.error('Error loading CVs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!user?.userId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert('Lỗi', 'Không thể đọc tệp đã chọn.');
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name || `cv-${Date.now()}`,
        type: asset.mimeType || 'application/octet-stream',
      } as any);
      formData.append('applicantId', user.userId);
      formData.append('fileName', asset.name || 'CV mới');

      await api.uploadCV(formData);
      await loadCVs();
      Alert.alert('Thành công', 'Tải lên CV thành công.');
    } catch (error) {
      console.error('Upload CV error:', error);
      Alert.alert('Lỗi', 'Không thể tải lên CV. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (cvId: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa CV này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteCV(cvId);
            setCvs(prev => prev.filter(cv => cv.id !== cvId));
          } catch (error) {
            console.error('Delete CV error:', error);
            Alert.alert('Lỗi', 'Không thể xóa CV.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: CV }) => {
    return (
      <View style={styles.cvCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cvName}>{item.fileName || 'CV không tên'}</Text>
          <Text style={styles.cvMeta}>
            Tải lên: {new Date(item.uploadedDate).toLocaleDateString()}
          </Text>
          {item.isUsedInApplication && (
            <Text style={styles.cvUsedTag}>Đang sử dụng cho ứng tuyển</Text>
          )}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => Linking.openURL(item.url)}>
            <Ionicons name="eye-outline" size={22} color="#1e7efc" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDelete(item.id)}
            disabled={item.isUsedInApplication}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={item.isUsedInApplication ? '#cbd5f5' : '#ef4444'}
            />
          </TouchableOpacity>
        </View>
      </View>
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
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>CV của bạn</Text>
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadDisabled]}
          onPress={handleUpload}
          disabled={isUploading}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={styles.uploadText}>{isUploading ? 'Đang tải...' : 'Tải CV'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cvs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingVertical: 12 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>Bạn chưa tải lên CV nào</Text>
            <Text style={styles.emptySubText}>Nhấn "Tải CV" để thêm hồ sơ của bạn.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e7efc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  uploadDisabled: {
    backgroundColor: '#93c5fd',
  },
  uploadText: {
    color: '#fff',
    fontWeight: '600',
  },
  cvCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  cvName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cvMeta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  cvUsedTag: {
    marginTop: 6,
    fontSize: 12,
    color: '#eab308',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptySubText: {
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default CvManagerScreen;


