import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { COLORS } from '../../constants';
import auth from '@react-native-firebase/auth'; // Firebase Auth enabled
import { useAuth } from '../../contexts/AuthContext';
import api, { authService } from '../../services/api';

const OTPScreen = ({ route, navigation }) => {
    const { phoneNumber, userData } = route.params; // userData contain registration fields
    const [code, setCode] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [timer, setTimer] = useState(60); // Resend timer

    useEffect(() => {
        // Start verification immediately
        signInWithPhoneNumber();
    }, []);

    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const signInWithPhoneNumber = async () => {
        setLoading(true);
        try {
            console.log('Sending OTP to:', phoneNumber);
            const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
            setConfirm(confirmation);
            setLoading(false);
            setTimer(60);
            console.log('OTP Sent via Firebase');
        } catch (error) {
            console.error('Error sending OTP:', error);
            // Fallback for dev environment or simulator
            if (error.code === 'auth/missing-client-identifier') {
                console.log('Falling back to mock for testing (Firebase missing config)');
                setTimeout(() => {
                    setLoading(false);
                    setTimer(60);
                    // Mock confirm object for 123456
                    setConfirm(null);
                }, 1000);
            } else {
                Alert.alert('Erreur', 'Impossible d\'envoyer le code SMS. ' + error.message);
                setLoading(false);
            }
        }
    };

    const verifyCode = async () => {
        if (code.length < 5) {
            Alert.alert('Erreur', 'Le code doit contenir au moins 5 chiffres');
            return;
        }

        setVerifying(true);
        try {
            // Code universel de test (fallback)
            if (code === '12345') {
                console.log('✅ Code universel accepté (mode test)');
            } else if (confirm) {
                // Vérification Firebase réelle
                await confirm.confirm(code);
            } else {
                // Pas de confirmation Firebase et pas le code universel
                throw new Error('Code invalide');
            }

            console.log('✅ Phone verified successfully');

            // DO NOT REGISTER HERE.
            // Navigate to ProfileTypeSelection to continue registration flow

            navigation.navigate('ProfileTypeSelection', {
                userData: {
                    ...userData,
                    phoneNumber: phoneNumber,
                    firebaseToken: 'valid-firebase-token-placeholder' // In real app, get ID token if needed
                }
            });

        } catch (error) {
            console.error('Invalid code or Verification failed:', error);
            Alert.alert('Erreur', 'Code invalide ou erreur de vérification');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Vérification</Text>
                <Text style={styles.subtitle}>
                    Un code a été envoyé au {phoneNumber}
                </Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Code à 5 chiffres"
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={code}
                        onChangeText={setCode}
                        editable={!verifying}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.verifyButton, verifying && styles.disabledButton]}
                    onPress={verifyCode}
                    disabled={verifying}
                >
                    {verifying ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.verifyButtonText}>Vérifier</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Vous n'avez pas reçu le code ? </Text>
                    {timer > 0 ? (
                        <Text style={styles.timerText}>Réessayer dans {timer}s</Text>
                    ) : (
                        <TouchableOpacity onPress={signInWithPhoneNumber} disabled={loading}>
                            <Text style={styles.resendLink}>Renvoyer</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 30,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 16,
        fontSize: 24,
        textAlign: 'center',
        backgroundColor: COLORS.white,
        color: COLORS.text,
        letterSpacing: 8,
    },
    verifyButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    verifyButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    resendContainer: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendText: {
        color: COLORS.textSecondary,
    },
    resendLink: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    timerText: {
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    }
});

export default OTPScreen;
