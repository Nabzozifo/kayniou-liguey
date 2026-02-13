import React, { useState, useEffect } from 'react';
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
// import { useAuth } from '../../contexts/AuthContext'; // If needed to refresh user subscription status
import { subscriptionService } from '../../services/api';

const PricingScreen = ({ navigation }) => {
    const [plans, setPlans] = useState({ basic: null, premium: null });
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const data = await subscriptionService.getPlans();
            if (data.success) {
                setPlans(data.plans);
            }
        } catch (error) {
            console.error('Erreur chargement plans:', error);
            Alert.alert('Erreur', 'Impossible de charger les abonnements');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId) => {
        if (planId === 'basic') {
            Alert.alert('Info', 'Vous avez déjà le plan basique par défaut.');
            return;
        }

        Alert.alert(
            'Confirmation',
            'Voulez-vous souscrire au plan Premium pour 10 000 FCFA / mois ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: async () => {
                        setSubscribing(true);
                        try {
                            // Mock payment process would be here
                            const response = await subscriptionService.subscribe(planId);

                            if (response.success) {
                                Alert.alert(
                                    'Félicitations !',
                                    'Vous êtes maintenant membre Premium. Profitez de tous vos avantages !',
                                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                                );
                            }
                        } catch (error) {
                            console.error('Erreur souscription:', error);
                            Alert.alert('Erreur', error.response?.data?.message || 'Impossible de souscrire');
                        } finally {
                            setSubscribing(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const renderFeatureItem = (text, included = true) => (
        <View style={styles.featureItem}>
            <Ionicons
                name={included ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={included ? COLORS.success : COLORS.textLight}
            />
            <Text style={[styles.featureText, !included && styles.featureTextDisabled]}>
                {text}
            </Text>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Boostez votre visibilité</Text>
                <Text style={styles.subtitle}>
                    Choisissez le plan qui correspond à vos besoins
                </Text>
            </View>

            {/* Plan Basique */}
            <View style={styles.planCard}>
                <View style={styles.planHeader}>
                    <Text style={styles.planName}>Basique</Text>
                    <Text style={styles.planPrice}>Gratuit</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.featuresList}>
                    {renderFeatureItem('Accès aux offres (délai 24h)')}
                    {renderFeatureItem('Bas de liste dans les recherches', false)}
                    {renderFeatureItem('Max 5 candidatures par jour')}
                    {renderFeatureItem('Badge Premium', false)}
                    {renderFeatureItem('Support prioritaire', false)}
                </View>
                <TouchableOpacity style={[styles.button, styles.buttonOutline]} disabled={true}>
                    <Text style={styles.buttonTextOutline}>Plan Actuel</Text>
                </TouchableOpacity>
            </View>

            {/* Plan Premium */}
            <View style={[styles.planCard, styles.premiumCard]}>
                <View style={styles.crownContainer}>
                    <Ionicons name="trophy" size={24} color="#FFD700" />
                </View>
                <View style={styles.planHeader}>
                    <Text style={[styles.planName, styles.premiumText]}>Premium</Text>
                    <Text style={[styles.planPrice, styles.premiumText]}>
                        10 000 <Text style={styles.currency}>FCFA / mois</Text>
                    </Text>
                </View>
                <View style={[styles.divider, styles.premiumDivider]} />
                <View style={styles.featuresList}>
                    {renderFeatureItem('Accès instantané aux offres')}
                    {renderFeatureItem('Priorité dans les recherches (Top liste)')}
                    {renderFeatureItem('Candidatures illimitées')}
                    {renderFeatureItem('Badge Premium 🏆')}
                    {renderFeatureItem('Support prioritaire')}
                </View>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleSubscribe('premium')}
                    disabled={subscribing}
                >
                    {subscribing ? (
                        <ActivityIndicator color={COLORS.primary} />
                    ) : (
                        <Text style={styles.buttonText}>Devenir Premium</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.disclaimer}>
                L'abonnement se renouvelle automatiquement. Vous pouvez annuler à tout moment.
            </Text>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    planCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        elevation: 2,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    premiumCard: {
        borderColor: '#FFD700',
        borderWidth: 2,
        backgroundColor: '#fffcf0', // Slight gold tint
        position: 'relative',
    },
    crownContainer: {
        position: 'absolute',
        top: -15,
        right: 20,
        backgroundColor: COLORS.white,
        padding: 5,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
        elevation: 4,
    },
    planHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    planName: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    premiumText: {
        color: '#B8860B', // Dark Golden Rod
    },
    planPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    currency: {
        fontSize: 14,
        fontWeight: 'normal',
        color: COLORS.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 16,
    },
    premiumDivider: {
        backgroundColor: '#FFE4B5',
    },
    featuresList: {
        gap: 12,
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 15,
        color: COLORS.text,
        flex: 1,
    },
    featureTextDisabled: {
        color: COLORS.textLight,
        textDecorationLine: 'line-through',
    },
    button: {
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.textLight,
    },
    buttonTextOutline: {
        color: COLORS.textLight,
        fontWeight: '600',
    },
    disclaimer: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 10,
    },
});

export default PricingScreen;
