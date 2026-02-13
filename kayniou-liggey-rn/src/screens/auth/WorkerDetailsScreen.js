import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, USER_TYPES } from '../../constants';
// import DateTimePicker from '@react-native-community/datetimepicker'; // Add if needed, using text for now to keep simple
import { useAuth } from '../../contexts/AuthContext';

const WorkerDetailsScreen = ({ route, navigation }) => {
    const { userData } = route.params;
    const { register, loading } = useAuth();

    const [formData, setFormData] = useState({
        dob: '', // Format YYYY-MM-DD
        address: '',
        city: '',
        idType: 'cin', // Default
        idNumber: '',
    });

    // Mocking document upload state
    const [documents, setDocuments] = useState({
        recto: null,
        verso: null,
        selfie: null,
    });

    const handleRegister = async () => {
        // Basic validation
        if (!formData.dob || !formData.address || !formData.city || !formData.idNumber) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        // In a real app, we would upload images here or before
        // For "dev" mode, we'll just send placeholders if selected

        const completeUserData = {
            ...userData,
            userType: USER_TYPES.WORKER,
            dob: formData.dob, // Ensure format is correct for backend (Date)
            address: `${formData.address}, ${formData.city}`,
            identityDocuments: {
                idType: formData.idType,
                idNumber: formData.idNumber,
                rectoURL: documents.recto ? 'mock_recto_url' : null,
                versoURL: documents.verso ? 'mock_verso_url' : null,
                selfieURL: documents.selfie ? 'mock_selfie_url' : null,
            }
        };

        const result = await register(completeUserData);

        if (result.success) {
            // Navigate to Category Selection with userId
            navigation.replace('CategorySelection', { userId: result.user._id });
        } else {
            Alert.alert('Erreur d\'inscription', result.error);
        }
    };

    const handleDocumentPick = (type) => {
        // Mock picker
        Alert.alert('Document', `Simuler l'upload de ${type}?`, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'OK', onPress: () => setDocuments({ ...documents, [type]: true }) }
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Détails du Profil</Text>
                <Text style={styles.subtitle}>
                    Informations nécessaires pour la vérification
                </Text>
            </View>

            <View style={styles.form}>
                {/* Date de naissance */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Date de naissance (AAAA-MM-JJ)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 1990-01-01"
                        value={formData.dob}
                        onChangeText={(text) => setFormData({ ...formData, dob: text })}
                    />
                </View>

                {/* Adresse */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Adresse</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Quartier, Rue..."
                        value={formData.address}
                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Ville</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Dakar"
                        value={formData.city}
                        onChangeText={(text) => setFormData({ ...formData, city: text })}
                    />
                </View>

                {/* Identité */}
                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Pièce d'identité</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Type de pièce</Text>
                    <View style={styles.row}>
                        {['cin', 'passport'].map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.typeButton, formData.idType === type && styles.typeButtonSelected]}
                                onPress={() => setFormData({ ...formData, idType: type })}
                            >
                                <Text style={[styles.typeButtonText, formData.idType === type && styles.typeButtonTextSelected]}>
                                    {type.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Numéro de pièce</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Numéro..."
                        value={formData.idNumber}
                        onChangeText={(text) => setFormData({ ...formData, idNumber: text })}
                    />
                </View>

                {/* Documents Upload (Mock) */}
                <View style={styles.docsContainer}>
                    <TouchableOpacity style={styles.docButton} onPress={() => handleDocumentPick('recto')}>
                        <Ionicons name={documents.recto ? "checkmark-circle" : "camera"} size={24} color={documents.recto ? COLORS.success : COLORS.primary} />
                        <Text style={styles.docText}>Recto</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.docButton} onPress={() => handleDocumentPick('verso')}>
                        <Ionicons name={documents.verso ? "checkmark-circle" : "camera"} size={24} color={documents.verso ? COLORS.success : COLORS.primary} />
                        <Text style={styles.docText}>Verso</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.docButton} onPress={() => handleDocumentPick('selfie')}>
                        <Ionicons name={documents.selfie ? "checkmark-circle" : "camera"} size={24} color={documents.selfie ? COLORS.success : COLORS.primary} />
                        <Text style={styles.docText}>Selfie</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitButtonText}>Terminer l'inscription</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 5,
    },
    form: {
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 12,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: COLORS.white,
    },
    sectionTitleContainer: {
        marginTop: 10,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    typeButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    typeButtonText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    typeButtonTextSelected: {
        color: COLORS.white,
    },
    docsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
    },
    docButton: {
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        width: '30%',
        backgroundColor: COLORS.white,
    },
    docText: {
        marginTop: 5,
        fontSize: 12,
        color: COLORS.text,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WorkerDetailsScreen;
