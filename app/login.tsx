import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple, ArrowLeft } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Complete the web browser for Google Sign-In
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const setUserInfo = useUserStore((state) => state.setUserInfo);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
  
  // Google Sign-In configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '376130747740-5kg1cn8hdof8292ehiubl3e8intq9ejn.apps.googleusercontent.com',
    iosClientId: '376130747740-ch4ck9m6qo7sbsim6eg3bjo7hl0esjmt.apps.googleusercontent.com',
    webClientId: '376130747740-qvia4hsrl1l328dkntqod8rbd2q4jbu1.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });
  useEffect(() => {
    checkAppleSignInAvailability();
  }, []);
  
  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleSignInSuccess(authentication.accessToken);
      }
    }
  }, [response]);
  
  const checkAppleSignInAvailability = async () => {
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleSignInAvailable(available);
    } catch (error) {
      console.log('Apple Sign-In not available:', error);
      setIsAppleSignInAvailable(false);
    }
  };
  
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    
    const url = 'https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/login';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        Alert.alert('Error', 'Server error. Please try again later.');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // Store user info consistently
        useUserStore.getState().setUserInfo(
          data.user_id,
          data.username,
          data.email || null
        );
        console.log('✅ User logged in:', username);
        Alert.alert('Success', 'Login successful!');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login error');
    }
  };

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    // Validate username
    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert('Password Requirements', 'Password must contain:\n• ' + passwordValidation.errors.join('\n• '));
      return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email: email || null,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        Alert.alert('Error', 'Server error. Please try again later.');
        return;
      }
      
      const data = await response.json();

      if (response.ok) {
        // Store user info after successful registration
        useUserStore.getState().setUserInfo(
          data.user_id,
          data.username,
          data.email || null
        );
        Alert.alert('Success', 'Registration successful!');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
  
  const handleGoogleSignInSuccess = async (accessToken: string) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      const userInfo = await userInfoResponse.json();
      
      // Send to your backend for OAuth login/registration
      const response = await fetch('https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/oauth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        }),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        Alert.alert('Error', 'Server error during Google Sign-In');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        // Store user info
        useUserStore.getState().setUserInfo(
          data.user_id,
          data.username,
          data.email
        );
        console.log('✅ Google Sign-In successful');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Google Sign-In failed');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  };
  
  const handleGoogleSignIn = () => {
    promptAsync();
  };
  
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send to your backend for OAuth login/registration
      const response = await fetch('https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/oauth/apple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appleId: credential.user,
          email: credential.email,
          fullName: credential.fullName,
          identityToken: credential.identityToken,
          authorizationCode: credential.authorizationCode,
        }),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        Alert.alert('Error', 'Server error during Apple Sign-In');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        // Store user info
        useUserStore.getState().setUserInfo(
          data.user_id,
          data.username,
          data.email
        );
        console.log('✅ Apple Sign-In successful');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Apple Sign-In failed');
      }
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') {
        console.log('Apple Sign-In cancelled');
      } else {
        console.error('Apple Sign-In error:', e);
        Alert.alert('Error', 'Failed to sign in with Apple');
      }
    }
  };
  
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Clear form when switching modes
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
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
            
            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {password.length > 0 && (
                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>Password must contain:</Text>
                    <Text style={[styles.requirementItem, password.length >= 8 && styles.requirementMet]}>
                      • At least 8 characters
                    </Text>
                    <Text style={[styles.requirementItem, /[A-Z]/.test(password) && styles.requirementMet]}>
                      • One uppercase letter
                    </Text>
                    <Text style={[styles.requirementItem, /[a-z]/.test(password) && styles.requirementMet]}>
                      • One lowercase letter
                    </Text>
                    <Text style={[styles.requirementItem, /[0-9]/.test(password) && styles.requirementMet]}>
                      • One number
                    </Text>
                    <Text style={[styles.requirementItem, /[!@#$%^&*(),.?":{}|<>]/.test(password) && styles.requirementMet]}>
                      • One special character
                    </Text>
                  </View>
                )}
              </>
            )}
            
            <Button
              title={isLogin ? 'Log In' : 'Sign Up'}
              onPress={isLogin ? handleLogin : handleRegister}
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
                disabled={!request}
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
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginBottom: 4,
    fontWeight: '600',
  },
  requirementItem: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  requirementMet: {
    color: '#4CAF50',
    fontWeight: '500',
  },
});