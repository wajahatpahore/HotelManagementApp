import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ScrollView, Picker } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Housekeeping');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    
    if (!email || !password || !confirmPassword || !name) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating user with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User created:', user.uid);
      
      // Save user info to Firestore
      await setDoc(doc(db, "Users", user.uid), {
        name: name,
        email: email,
        role: role
      });
      
      console.log('User saved to Firestore');
      setLoading(false);
      navigation.replace('Login');
    } catch (err) {
      setLoading(false);
      const errorMsg = err.message || 'Registration failed';
      console.log('Registration Error:', errorMsg);
      setError(errorMsg);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Account</Text>
      
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      ) : null}
      
      <TextInput 
        placeholder="Full Name" 
        style={styles.input} 
        onChangeText={setName}
        value={name}
        editable={!loading}
      />
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
      <TextInput 
        placeholder="Confirm Password" 
        style={styles.input} 
        secureTextEntry 
        onChangeText={setConfirmPassword}
        value={confirmPassword}
        editable={!loading}
      />
      <Text style={styles.label}>Select Role:</Text>
      <Picker
        selectedValue={role}
        onValueChange={(itemValue) => setRole(itemValue)}
        style={styles.picker}
        enabled={!loading}
      >
        <Picker.Item label="Housekeeping" value="Housekeeping" />
        <Picker.Item label="Admin" value="Admin" />
      </Picker>
      <Button 
        title={loading ? "Registering..." : "Register"} 
        onPress={handleRegister} 
        color="#2c3e50"
        disabled={loading}
      />
      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
        Already have an account? Login here.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f6fa' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, marginTop: 20 },
  input: { borderBottomWidth: 1, marginBottom: 15, padding: 10, backgroundColor: '#fff', borderRadius: 5 },
  label: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
  picker: { marginBottom: 15, backgroundColor: '#fff', borderRadius: 5 },
  errorBox: { backgroundColor: '#ffebee', borderLeftWidth: 4, borderLeftColor: '#c62828', padding: 15, marginBottom: 20, borderRadius: 5 },
  errorText: { color: '#c62828', fontSize: 14, fontWeight: '500' },
  link: { marginTop: 20, color: 'blue', textAlign: 'center', marginBottom: 40 }
});