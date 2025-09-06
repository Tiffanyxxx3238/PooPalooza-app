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
import { makeRedirectUri } from 'expo-auth-session';

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
  // 忘記密碼相關的 state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [userSecurityQuestion, setUserSecurityQuestion] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [resetUsername, setResetUsername] = useState('');

    // 預設的安全問題
  const securityQuestions = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your favorite movie?",
    "What was the name of your first school?",
    "What is your favorite food?",
  ];
  // Google Sign-In configuration

const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: '376130747740-qvia4hsrl1l328dkntqod8rbd2q4jbu1.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  redirectUri: 'https://auth.expo.io/@rhdairy24/poopalooza-630t3r0', 
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
  } else if (response?.type === 'error') {
    console.error('❌ Google Sign-In failed:', response);
    Alert.alert('登入失敗', 'Google 授權錯誤');
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
    if (!securityQuestion || !securityAnswer) {
      Alert.alert('Error', 'Security question and answer are required');
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
          security_question: securityQuestion,
          security_answer: securityAnswer,
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
  const handleForgotPassword = async () => {
    setShowForgotPassword(true);
    setResetStep(1); 
  };
const handleGetSecurityQuestion = async () => {
  if (!resetUsername) {
    Alert.alert('Error', 'Please enter your username');
    return;
  }

  try {
    const response = await fetch('https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: resetUsername }),
    });

    const data = await response.json();

    if (data.success && data.security_question) {
      setUserSecurityQuestion(data.security_question);
      setResetStep(2); // 進入下一步
    } else {
      Alert.alert('Error', 'No recovery method available for this account');
    }
  } catch (error) {
    Alert.alert('Error', 'Network connection failed');
  }
};
const handleResetPassword = async () => {
  if (!resetAnswer || !newPassword || !confirmNewPassword) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    Alert.alert('Error', 'Passwords do not match');
    return;
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    Alert.alert('Password Requirements', 'Password must contain:\n• ' + passwordValidation.errors.join('\n• '));
    return;
  }

  try {
    const response = await fetch('https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: resetUsername, // 使用 resetUsername 而不是 username
        security_answer: resetAnswer,
        new_password: newPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert('Success', 'Password reset successful! Please login with your new password');
      setShowForgotPassword(false);
      setResetStep(1);
      setResetUsername('');
      setResetAnswer('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      Alert.alert('Error', data.error || 'Invalid answer');
    }
  } catch (error) {
    Alert.alert('Error', 'Network connection failed');
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
                    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
       Security Question (Required) 
      </Text>
      <View style={styles.selectContainer}>
        {securityQuestions.map((question, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.questionOption,
              securityQuestion === question && styles.questionSelected
            ]}
            onPress={() => setSecurityQuestion(question)}
          >
            <Text style={[
              styles.questionText,
              securityQuestion === question && styles.questionTextSelected
            ]}>
              {question}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
    
    {securityQuestion && (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Security Answer(Required)</Text>
        <TextInput
          style={styles.input}
          placeholder="Your answer (case insensitive)"
          value={securityAnswer}
          onChangeText={setSecurityAnswer}
          autoCapitalize="none"
        />
      </View>
    )}

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
            {isLogin && (
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
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
{showForgotPassword && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <TouchableOpacity 
        style={styles.modalClose}
        onPress={() => {
          setShowForgotPassword(false);
          setResetStep(1);
          setResetUsername('');
          setResetAnswer('');
          setNewPassword('');
          setConfirmNewPassword('');
        }}
      >
        <Text style={styles.modalCloseText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.modalTitle}>Reset Password</Text>
      
      {resetStep === 1 ? (
        // 步驟 1: 輸入用戶名
        <>
          <Text style={styles.modalDescription}>
            Enter your username to reset password
          </Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Username"
            placeholderTextColor="#999"
            value={resetUsername}
            onChangeText={setResetUsername}
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={handleGetSecurityQuestion}
          >
            <Text style={styles.modalButtonText}>Continue</Text>
          </TouchableOpacity>
        </>
      ) : (
        // 步驟 2: 回答安全問題
        <>
          <Text style={styles.modalDescription}>
            Answer your security question:
          </Text>
          
          <Text style={styles.securityQuestionDisplay}>
            {userSecurityQuestion}
          </Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Your answer"
            placeholderTextColor="#999"
            value={resetAnswer}
            onChangeText={setResetAnswer}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="New password"
            placeholderTextColor="#999"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="Confirm new password"
            placeholderTextColor="#999"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secureTextEntry
          />
          
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={handleResetPassword}
          >
            <Text style={styles.modalButtonText}>Reset Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modalBackButton}
            onPress={() => {
              setResetStep(1);
              setResetAnswer('');
              setNewPassword('');
              setConfirmNewPassword('');
            }}
          >
            <Text style={styles.modalBackText}>Back</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
)}
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
    color: '#6b5740ff',
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
   forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalOr: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 8,
    fontSize: 14,
  },
  modalButton: {
    backgroundColor: Colors.primary.accent,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBackButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalBackText: {
    color: Colors.primary.accent,
    fontSize: 14,
  },
  selectContainer: {
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
  padding: 8,
},
questionOption: {
  padding: 12,
  borderRadius: 6,
  marginBottom: 6,
  backgroundColor: '#F5F5F5',
},
questionSelected: {
  backgroundColor: Colors.primary.accent,
},
questionText: {
  fontSize: 14,
  color: '#333',
},
questionTextSelected: {
  color: '#FFFFFF',
  fontWeight: '500',
},
securityQuestionDisplay: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333',
  marginBottom: 16,
  padding: 12,
  backgroundColor: '#F0F0F0',
  borderRadius: 8,
},
});