import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/api';
import { Applicant, Certificate } from '../../types/api';
import { Ionicons } from '@expo/vector-icons';

const ProfileEditScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthday: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    yearsOfExperience: 0,
    careerObjective: '',
    universityName: '',
    major: '',
    degreeLevel: '',
    graduationYear: new Date().getFullYear(),
    gpa: 0,
    skills: [] as string[],
    certificates: [] as Certificate[],
  });

  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user?.userId) return;

    setIsLoading(true);
    try {
      const response = await api.getApplicantById(user.userId);
      const applicant = response.data;

      setFormData({
        firstName: applicant.firstName || '',
        lastName: applicant.lastName || '',
        email: applicant.email || '',
        phone: applicant.phone || '',
        address: applicant.address || '',
        birthday: applicant.birthday || '',
        gender: applicant.gender || 'MALE',
        yearsOfExperience: applicant.yearsOfExperience || 0,
        careerObjective: applicant.careerObjective || '',
        universityName: applicant.universityName || '',
        major: applicant.major || '',
        degreeLevel: applicant.degreeLevel || '',
        graduationYear: applicant.graduationYear || new Date().getFullYear(),
        gpa: applicant.gpa || 0,
        skills: applicant.skills || [],
        certificates: applicant.certificates || [],
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.userId) return;

    setIsSaving(true);
    try {
      await api.updateApplicant({
        id: user.userId,
        userId: user.userId,
        ...formData,
      });
      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e7efc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Họ</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              placeholder="Nhập họ"
            />
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>Tên</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              placeholder="Nhập tên"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.email}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Nhập địa chỉ"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ngày sinh</Text>
          <TextInput
            style={styles.input}
            value={formData.birthday}
            onChangeText={(text) => setFormData({ ...formData, birthday: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                formData.gender === 'MALE' && styles.radioOptionActive,
              ]}
              onPress={() => setFormData({ ...formData, gender: 'MALE' })}
            >
              <Text
                style={[
                  styles.radioText,
                  formData.gender === 'MALE' && styles.radioTextActive,
                ]}
              >
                Nam
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioOption,
                formData.gender === 'FEMALE' && styles.radioOptionActive,
              ]}
              onPress={() => setFormData({ ...formData, gender: 'FEMALE' })}
            >
              <Text
                style={[
                  styles.radioText,
                  formData.gender === 'FEMALE' && styles.radioTextActive,
                ]}
              >
                Nữ
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số năm kinh nghiệm</Text>
          <TextInput
            style={styles.input}
            value={formData.yearsOfExperience.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, yearsOfExperience: parseInt(text) || 0 })
            }
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mục tiêu nghề nghiệp</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.careerObjective}
          onChangeText={(text) => setFormData({ ...formData, careerObjective: text })}
          placeholder="Nhập mục tiêu nghề nghiệp"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kỹ năng</Text>
        <View style={styles.skillInputContainer}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            value={skillInput}
            onChangeText={setSkillInput}
            placeholder="Nhập kỹ năng"
            onSubmitEditing={addSkill}
          />
          <TouchableOpacity style={styles.addButton} onPress={addSkill}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.skillsList}>
          {formData.skills.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
              <TouchableOpacity onPress={() => removeSkill(skill)}>
                <Ionicons name="close" size={16} color="#1e7efc" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Học vấn</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Trường học</Text>
          <TextInput
            style={styles.input}
            value={formData.universityName}
            onChangeText={(text) => setFormData({ ...formData, universityName: text })}
            placeholder="Nhập tên trường"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Chuyên ngành</Text>
          <TextInput
            style={styles.input}
            value={formData.major}
            onChangeText={(text) => setFormData({ ...formData, major: text })}
            placeholder="Nhập chuyên ngành"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bằng cấp</Text>
          <TextInput
            style={styles.input}
            value={formData.degreeLevel}
            onChangeText={(text) => setFormData({ ...formData, degreeLevel: text })}
            placeholder="ASSOCIATE, BACHELOR, MASTER, DOCTORATE"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Năm tốt nghiệp</Text>
            <TextInput
              style={styles.input}
              value={formData.graduationYear.toString()}
              onChangeText={(text) =>
                setFormData({ ...formData, graduationYear: parseInt(text) || 0 })
              }
              placeholder="2024"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>GPA</Text>
            <TextInput
              style={styles.input}
              value={formData.gpa.toString()}
              onChangeText={(text) =>
                setFormData({ ...formData, gpa: parseFloat(text) || 0 })
              }
              placeholder="3.5"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
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
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  radioOptionActive: {
    backgroundColor: '#1e7efc',
    borderColor: '#1e7efc',
  },
  radioText: {
    fontSize: 14,
    color: '#374151',
  },
  radioTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  skillInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  skillInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#1e7efc',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  skillText: {
    fontSize: 12,
    color: '#1e7efc',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e7efc',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileEditScreen;

