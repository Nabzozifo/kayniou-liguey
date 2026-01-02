import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import api from '../../services/api';

const CategorySelectionScreen = ({ navigation, route }) => {
  const { userId } = route.params || {};
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'Plomberie', icon: '🔧', color: COLORS.primary },
    { id: 'Électricité', icon: '⚡', color: COLORS.warning },
    { id: 'Menuiserie', icon: '🪚', color: COLORS.secondary },
    { id: 'Maçonnerie', icon: '🧱', color: COLORS.error },
    { id: 'Peinture', icon: '🎨', color: COLORS.accent },
    { id: 'Jardinage', icon: '🌿', color: COLORS.success },
    { id: 'Nettoyage', icon: '✨', color: COLORS.info },
  ];

  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      if (selectedCategories.length >= 2) {
        Alert.alert('Limite atteinte', 'Vous pouvez sélectionner maximum 2 catégories');
        return;
      }
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner au moins une catégorie');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/worker-profile/${userId}`, {
        categories: selectedCategories,
      });
      Alert.alert('Succès', 'Vos catégories ont été enregistrées');
      navigation.replace('Main');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'enregistrer les catégories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choisissez vos métiers</Text>
        <Text style={styles.subtitle}>
          Sélectionnez 1 ou 2 catégories de services que vous proposez
        </Text>
      </View>

      <ScrollView style={styles.categoriesContainer}>
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardSelected,
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryContent}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    isSelected && styles.categoryNameSelected,
                  ]}
                >
                  {category.id}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedCategories.length}/2 catégories sélectionnées
        </Text>
        <TouchableOpacity
          style={[
            styles.submitButton,
            selectedCategories.length === 0 && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || selectedCategories.length === 0}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Valider</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  categoriesContainer: {
    flex: 1,
    padding: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  categoryCardSelected: {
    borderColor: COLORS.success,
    backgroundColor: '#f0f9ff',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryNameSelected: {
    color: COLORS.primary,
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectedCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default CategorySelectionScreen;
