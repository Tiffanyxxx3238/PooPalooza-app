import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple, ArrowLeft } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen() {
  const router = useRouter();
  const setUserInfo = useUserStore((state) => state.setUserInfo);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
  
  useEffect(() => {
    checkAppleSignInAvailability();
  }, []);
  
  const checkAppleSignInAvailability = async () => {
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleSignInAvailable(available);
    } catch (error) {
      console.log('Apple Sign-In not available:', error);
      setIsAppleSignInAvailable(false);
    }
  };
  
  const handleAuth = () => {
    // In a real app, you would authenticate with a backend
    // For now, we'll just simulate a successful login
    setUserInfo(username || 'Guest User', 'user@example.com');
    router.replace('/(tabs)');
  };
  
  const handleGoogleSignIn = () => {
    // In a real app, you would implement Google Sign In
    setUserInfo('Google User', 'google@example.com');
    router.replace('/(tabs)');
  };
  
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const name = credential.fullName?.givenName || 'Apple User';
      const email = credential.email || 'unknown@example.com';

      setUserInfo(name, email); // 存進全域狀態
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') {
        console.log('Apple Sign-In cancelled');
      } else {
        console.error('Apple Sign-In error:', e);
      }
    }
  };
  
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };
  
  const handleBack = () => {
    router.back();
  };
  

  return (
    <LinearGradient
      colors={['#F5E6C4', '#F0D6A7']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={Colors.primary.accent} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9vcCUyMGVtb2ppfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' }}
              style={styles.logoImage}
            />
            <Text style={styles.logoText}>PooPalooza</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Log in to your account' : 'Create a new account'}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
            
            <Button
              title={isLogin ? 'Log In' : 'Sign Up'}
              onPress={handleAuth}
              style={styles.authButton}
            />
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
              >
                <Text style={styles.socialButtonText}>
                  <Text style={styles.googleIcon}>G</Text> Continue with Google
                </Text>
              </TouchableOpacity>
              
              {isAppleSignInAvailable && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={8}
                  style={{ width: '100%', height: 44 }}
                  onPress={handleAppleSignIn}
                />
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.toggleAuth}
              onPress={toggleAuthMode}
            >
              <Text style={styles.toggleAuthText}>
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary.accent,
    marginTop: 12,
  },
  formContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary.accent,
    fontSize: 14,
  },
  authButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.primary.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: Colors.primary.lightText,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
  socialButtonText: {
    fontSize: 16,
    color: Colors.primary.text,
  },
  toggleAuth: {
    alignItems: 'center',
  },
  toggleAuthText: {
    color: Colors.primary.accent,
    fontSize: 14,
  },
});