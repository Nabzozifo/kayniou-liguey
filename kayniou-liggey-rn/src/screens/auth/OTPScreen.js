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
// import auth from '@react-native-firebase/auth'; // Ensure Firebase Auth is installed
import { useAuth } from '../../contexts/AuthContext';
import api, { authService } from '../../services/api';

const OTPScreen = ({ route, navigation }) => {
    const { phoneNumber, userData } = route.params; // userData contain registration fields
    const [code, setCode] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [timer, setTimer] = useState(60); // Resend timer

    // NOTE: Assuming Firebase creates a `confirmation` object that has a `confirm(code)` method
    // In a real app, integrate @react-native-firebase/auth

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

    // Mock implementation for demonstration since I cannot interact with Firebase Auth directly
    // In production, replace `mockSignIn` with `auth().signInWithPhoneNumber(phoneNumber)`
    const signInWithPhoneNumber = async () => {
        setLoading(true);
        try {
            console.log('Sending OTP to:', phoneNumber);

            // MOCK: In production use: const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
            // For now, simulate success
            setTimeout(() => {
                setConfirm({ verificationId: 'mock-verification-id' }); // Mock confirm object
                setLoading(false);
                setTimer(60);
                // Alert.alert('Code envoyé', 'Un code de vérification a été envoyé par SMS (Mock: 123456)');
                console.log('Mock OTP sent: 123456');
            }, 1500);

        } catch (error) {
            console.error('Error sending OTP:', error);
            Alert.alert('Erreur', 'Impossible d\'envoyer le code SMS. Vérifiez votre connexion.');
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (code.length !== 6) {
            Alert.alert('Erreur', 'Le code doit contenir 6 chiffres');
            return;
        }

        setVerifying(true);
        try {
            // MOCK: In production use: await confirm.confirm(code);
            // const credential = await auth.PhoneAuthProvider.credential(confirm.verificationId, code);

            if (code !== '123456') { // Mock check
                throw new Error('Code invalide');
            }

            console.log('✅ Phone verified successfully');

            // 1. Register User in Backend
            // We pass isPhoneVerified: true implicitly or call verify-phone after register

            // Option A: Register first
            const registerResponse = await authService.register({
                ...userData,
                phoneNumber: phoneNumber, // Ensure format matches backend expectation
            });

            console.log('✅ User registered:', registerResponse.user.id);

            // 2. Call Verify Phone endpoint to mark as verified in DB
            // In real scenario, we pass the Firebase ID Token
            // const idToken = await auth().currentUser.getIdToken();
            const idToken = 'mock-firebase-id-token';

            await authService.verifyPhone(idToken);
            console.log('✅ Phone verification status updated in backend');

            // 3. Navigate to Main App (Login or Home)
            // Since register automatically logs in via Context (usually), check AuthContext
            // If AuthContext handles login, we might need to manually set user.

            Alert.alert('Félicitations', 'Votre compte a été créé et vérifié avec succès !', [
                { text: 'OK', onPress: () => navigation.navigate('Login') } // Or reset to Home
            ]);

        } catch (error) {
            console.error('Invalid code or Register failed:', error);
            Alert.alert('Erreur', error.message || 'Code invalide ou erreur d\'inscription');
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
                        placeholder="Code à 6 chiffres"
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
