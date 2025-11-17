import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import JobsScreen from '../screens/main/JobsScreen';
import JobDetailScreen from '../screens/main/JobDetailScreen';
import AppliedJobsScreen from '../screens/main/AppliedJobsScreen';
import SavedJobsScreen from '../screens/main/SavedJobsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ProfileEditScreen from '../screens/main/ProfileEditScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import AIChatScreen from '../screens/main/AIChatScreen';
import CvManagerScreen from '../screens/main/CvManagerScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Jobs: undefined;
  AppliedJobs: undefined;
  SavedJobs: undefined;
  Notifications: undefined;
  Assistant: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  JobDetail: { jobId: string };
  ProfileEdit: undefined;
  CvManager: undefined;
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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'AppliedJobs') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'SavedJobs') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Assistant') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
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
        name="AppliedJobs"
        component={AppliedJobsScreen}
        options={{ title: 'Đã ứng tuyển' }}
      />
      <Tab.Screen
        name="SavedJobs"
        component={SavedJobsScreen}
        options={{ title: 'Đã lưu' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Thông báo' }}
      />
      <Tab.Screen
        name="Assistant"
        component={AIChatScreen}
        options={{ title: 'AI Assistant' }}
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
        name="CvManager"
        component={CvManagerScreen}
        options={{
          headerShown: true,
          title: 'Quản lý CV',
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

