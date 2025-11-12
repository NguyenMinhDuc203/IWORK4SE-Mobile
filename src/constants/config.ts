import Constants from 'expo-constants';

export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  USER_TYPE: 'userType',
  ROLE: 'role',
  FULL_NAME: 'fullName',
  EMAIL: 'email',
  PHONE: 'phone',
};

