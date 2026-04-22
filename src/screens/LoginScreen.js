import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Attempting login with:', email);
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigation.replace('Dashboard');
    } catch (err) {
      setLoading(false);
      const errorMsg = err.message || 'Login failed';
      console.log('Login Error:', errorMsg);
      setError(errorMsg);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Hotel Management System</Text>
      
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      ) : null}
      
      <TextInput 
        placeholder="Email" 
        style={styles.input} 
        onChangeText={setEmail}
        value={email}
        editable={!loading}
      />
      <TextInput 
        placeholder="Password" 
        style={styles.input} 
        secureTextEntry 
        onChangeText={setPassword}
        value={password}
        editable={!loading}
      />
      <Button 
        title={loading ? "Logging in..." : "Login"} 
        onPress={handleLogin} 
        color="#2c3e50"
        disabled={loading}
      />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        Don't have an account? Register here.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f6fa' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, marginTop: 40 },
  input: { borderBottomWidth: 1, marginBottom: 20, padding: 10, backgroundColor: '#fff', borderRadius: 5 },
  errorBox: { backgroundColor: '#ffebee', borderLeftWidth: 4, borderLeftColor: '#c62828', padding: 15, marginBottom: 20, borderRadius: 5 },
  errorText: { color: '#c62828', fontSize: 14, fontWeight: '500' },
  link: { marginTop: 20, color: 'blue', textAlign: 'center' }
});