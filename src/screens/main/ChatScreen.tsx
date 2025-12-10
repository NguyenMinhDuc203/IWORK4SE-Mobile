import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/api';
import { ChatMessage } from '../../types/api';
import { MainStackParamList } from '../../navigation/AppNavigator';

type ChatRouteProp = RouteProp<MainStackParamList, 'Chat'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const ChatScreen = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>(route.params?.conversationId);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const receiverId = route.params?.receiverId;
  const receiverName = route.params?.receiverName || 'Người dùng';

  useEffect(() => {
    navigation.setOptions({
      title: receiverName,
      headerBackTitle: 'Quay lại',
    });
  }, [navigation, receiverName]);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      markAsRead(conversationId);
    } else {
      setIsLoading(false);
    }
  }, [conversationId]);

  const loadMessages = async (convId: number) => {
    setIsLoading(true);
    try {
      const res = await api.getConversationMessages(convId, 0, 50);
      const sorted = (res.content || []).sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
      setMessages(sorted);
    } catch (error) {
      console.error('Error loading messages', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (convId: number) => {
    try {
      await api.markConversationAsRead(convId);
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !receiverId) return;
    setIsSending(true);
    try {
      const optimistic: ChatMessage = {
        id: Date.now(),
        conversationId: conversationId || 0,
        senderId: user?.userId || '',
        senderName: user?.fullName || 'Bạn',
        receiverId,
        content,
        messageType: 'TEXT',
        sentAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages((prev) => [...prev, optimistic]);
      setInput('');
      scrollToBottom();

      const sent = await api.sendMessage({ receiverId, content });
      setConversationId(sent.conversationId);
      setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), sent]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.senderId === user?.userId;
    return (
      <View style={[styles.messageRow, isUser ? styles.rightAlign : styles.leftAlign]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.otherBubble]}>
          {item.content ? <Text style={isUser ? styles.userText : styles.otherText}>{item.content}</Text> : null}
          <Text style={styles.timestamp}>{new Date(item.sentAt).toLocaleTimeString('vi-VN')}</Text>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToBottom}
      />

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Nhập tin nhắn..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  messageRow: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  rightAlign: {
    alignSelf: 'flex-end',
  },
  leftAlign: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 14,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#1e7efc',
  },
  otherBubble: {
    backgroundColor: '#fff',
  },
  userText: {
    color: '#fff',
    fontSize: 15,
  },
  otherText: {
    color: '#0f172a',
    fontSize: 15,
  },
  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    fontSize: 15,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1e7efc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
});

export default ChatScreen;

