import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import JobsScreen from '../screens/main/JobsScreen';
import JobDetailScreen from '../screens/main/JobDetailScreen';
import AppliedJobsScreen from '../screens/main/AppliedJobsScreen';
import SavedJobsScreen from '../screens/main/SavedJobsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ProfileEditScreen from '../screens/main/ProfileEditScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import AIChatScreen from '../screens/main/AIChatScreen';
import CvManagerScreen from '../screens/main/CvManagerScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import ChatScreen from '../screens/main/ChatScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Jobs: undefined;
  Assistant: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  AppliedJobs: undefined;
  SavedJobs: undefined;
  Notifications: undefined;
  JobDetail: { jobId: string };
  ProfileEdit: undefined;
  ChangePassword: undefined;
  CvManager: undefined;
  Chat: { conversationId?: number; receiverId?: string; receiverName?: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const AuthStackNavigator = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const MainStackNavigator = createNativeStackNavigator<MainStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Assistant') {
            iconName = focused ? 'logo-android' : 'logo-android';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1e7efc',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity
            style={{ paddingHorizontal: 12 }}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#1e7efc" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{ title: 'Việc làm' }}
      />
      <Tab.Screen
        name="Assistant"
        component={AIChatScreen}
        options={{ title: 'AI Assistant' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: 'Tin nhắn' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  return (
    <AuthStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNavigator.Screen name="Login" component={LoginScreen} />
      <AuthStackNavigator.Screen name="Register" component={RegisterScreen} />
      <AuthStackNavigator.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStackNavigator.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStackNavigator.Navigator>
  );
};

const MainStack = () => {
  return (
    <MainStackNavigator.Navigator>
      <MainStackNavigator.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
      <MainStackNavigator.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{ 
          headerShown: true, 
          title: 'Chi tiết việc làm',
          headerBackTitle: 'Back'
        }}
      />
      <MainStackNavigator.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ 
          headerShown: true, 
          title: 'Chỉnh sửa hồ sơ',
          headerBackTitle: 'Back'
        }}
      />
      <MainStackNavigator.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          headerShown: true,
          title: 'Thay đổi mật khẩu',
          headerBackTitle: 'Back',
        }}
      />
      <MainStackNavigator.Screen
        name="CvManager"
        component={CvManagerScreen}
        options={{
          headerShown: true,
          title: 'Quản lý CV',
          headerBackTitle: 'Back',
        }}
      />
      <MainStackNavigator.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          title: 'Tin nhắn',
          headerBackTitle: 'Back',
        }}
      />
      <MainStackNavigator.Screen
        name="AppliedJobs"
        component={AppliedJobsScreen}
        options={{
          headerShown: true,
          title: 'Đã ứng tuyển',
          headerBackTitle: 'Back',
        }}
      />
      <MainStackNavigator.Screen
        name="SavedJobs"
        component={SavedJobsScreen}
        options={{
          headerShown: true,
          title: 'Đã lưu',
          headerBackTitle: 'Back',
        }}
      />
      <MainStackNavigator.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: true,
          title: 'Thông báo',
          headerBackTitle: 'Back',
        }}
      />
    </MainStackNavigator.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainStack} options={{ headerShown: false }} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

