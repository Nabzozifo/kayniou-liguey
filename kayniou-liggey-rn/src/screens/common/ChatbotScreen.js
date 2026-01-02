import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS } from '../../constants';

// URL de l'API
// const API_URL = 'https://pamela-unrestful-thermodynamically.ngrok-free.dev/api';
const API_URL = 'http://16.171.193.183:5000/api';

const ChatbotScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Bonjour ! 👋 Je suis votre assistant virtuel Kayniou Liggey. Comment puis-je vous aider aujourd\'hui ?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollViewRef = useRef();

  // Charger les suggestions au montage
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/chatbot/suggestions`);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
    }
  };

  const sendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    // Cacher les suggestions après la première question
    setShowSuggestions(false);

    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll vers le bas
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Appeler l'API du chatbot
      const response = await axios.post(`${API_URL}/chatbot/ask`, {
        question: text.trim(),
        conversationHistory: messages
          .slice(-4) // Derniers 4 messages pour contexte
          .map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
      });

      if (response.data.success) {
        // Ajouter la réponse du bot
        const botMessage = {
          id: Date.now() + 1,
          text: response.data.answer,
          sender: 'bot',
          timestamp: new Date(),
          method: response.data.method,
          confidence: response.data.confidence,
        };

        setMessages(prev => [...prev, botMessage]);

        // Scroll vers le bas
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);

      // Message d'erreur
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setInputText(suggestion);
    sendMessage(suggestion);
  };

  const renderMessage = (message) => {
    const isBot = message.sender === 'bot';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
        ]}
      >
        {isBot && (
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubbles" size={16} color={COLORS.white} />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isBot ? styles.botBubble : styles.userBubble,
            message.isError && styles.errorBubble,
          ]}
        >
          <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
            {message.text}
          </Text>

          {/* Badge méthode (DEBUG - optionnel) */}
          {message.method && __DEV__ && (
            <Text style={styles.methodBadge}>
              {message.method} • {(message.confidence * 100).toFixed(0)}%
            </Text>
          )}

          <Text style={[styles.timestamp, isBot ? styles.botTimestamp : styles.userTimestamp]}>
            {message.timestamp.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {!isBot && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color={COLORS.white} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Assistant IA</Text>
            <Text style={styles.headerSubtitle}>Réponse instantanée</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}

          {/* Indicateur de saisie */}
          {isLoading && (
            <View style={styles.typingIndicator}>
              <View style={styles.botAvatar}>
                <Ionicons name="chatbubbles" size={16} color={COLORS.white} />
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.typingText}>En train d'écrire...</Text>
              </View>
            </View>
          )}

          {/* Suggestions (affichées au début) */}
          {showSuggestions && suggestions.length > 0 && messages.length === 1 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>💡 Questions fréquentes :</Text>
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Ionicons name="help-circle-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Posez votre question..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
            />

            {inputText.length > 0 && (
              <Text style={styles.charCounter}>{inputText.length}/500</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  menuButton: {
    padding: 5,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messagesContent: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },
  botBubble: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
  },
  errorBubble: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: COLORS.dark,
  },
  userText: {
    color: COLORS.white,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
  },
  botTimestamp: {
    color: COLORS.gray,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  methodBadge: {
    fontSize: 9,
    color: COLORS.primary,
    marginTop: 5,
    fontStyle: 'italic',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  typingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
  suggestionsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    minHeight: 44,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    color: COLORS.dark,
    maxHeight: 80,
  },
  charCounter: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
});

export default ChatbotScreen;
