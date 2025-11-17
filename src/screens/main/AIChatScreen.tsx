import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/api';
import { AIChatResponse } from '../../types/api';

type ChatMessage = {
  id: string;
  sender: 'USER' | 'AI';
  content: string;
  createdAt: string;
};

const AIChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'AI',
      content: 'Xin chào! Tôi có thể giúp bạn tìm việc hoặc tư vấn về CV, phỏng vấn… Bạn cần gì?',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string | undefined>(undefined);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    scrollToBottom();

    setIsSending(true);
    try {
      const response = await api.sendAIMessage(trimmed, conversationHistory);
      const aiResponse = extractAIResponse(response);

      setConversationHistory(aiResponse?.conversationHistory);

      if (aiResponse?.response) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'AI',
          content: aiResponse.response,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
        scrollToBottom();
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'AI',
        content: 'Xin lỗi, tôi hiện không thể trả lời. Bạn hãy thử lại sau nhé!',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const extractAIResponse = (payload: AIChatResponse | { data: AIChatResponse }): AIChatResponse => {
    if ('response' in payload && typeof payload.response === 'string') {
      return payload;
    }
    return payload.data;
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'USER';
    return (
      <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.aiContainer]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>{item.content}</Text>
        </View>
        <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
      </View>
    );
  };

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
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToBottom}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Nhập câu hỏi của bạn..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isSending}
        >
          {isSending ? (
            <Ionicons name="hourglass" size={20} color="#fff" />
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
    backgroundColor: '#f1f5f9',
  },
  listContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#1e7efc',
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#0f172a',
  },
  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 120,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  sendButton: {
    backgroundColor: '#1e7efc',
    borderRadius: 24,
    padding: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
});

export default AIChatScreen;


