import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        // Navigate to Dashboard on success
        navigation.replace('Dashboard');
      })
      .catch(error => Alert.alert("Login Error", error.message));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hotel Management System</Text>
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry onChangeText={setPassword} />
      <Button title="Login" onPress={handleLogin} color="#2c3e50" />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        Don't have an account? Register here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f6fa' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { borderBottomWidth: 1, marginBottom: 20, padding: 10, backgroundColor: '#fff' },
  link: { marginTop: 20, color: 'blue', textAlign: 'center' }
});

const handleRoleBasedNavigation = async (user, navigation) => {
  if (user) {
    // Reference to the specific user document
    const userDocRef = doc(db, "Users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const userRole = userData.role;

      if (userRole === "Admin") {
        navigation.replace("AdminDashboard"); // Full Access
      } else if (userRole === "Housekeeping") {
        navigation.replace("HousekeepingView"); // Limited Access
      }
    } else {
      console.log("No such user record in Firestore!");
    }
  }
};

{userRole === 'Admin' && (
  <TouchableOpacity style={styles.adminButton} onPress={() => navigation.navigate('AddRoom')}>
    <Text>Add New Room</Text>
  </TouchableOpacity>
)}