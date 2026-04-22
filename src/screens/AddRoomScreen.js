import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Install: npx expo install @react-navigation/native
import { db } from '../firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';

export default function AddRoomScreen({ navigation }) {
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Standard');

  const handleAddRoom = async () => {
    if (!roomNumber) {
      Alert.alert("Error", "Please enter a room number.");
      return;
    }

    try {
      // Reference to the Rooms collection with Room Number as Document ID
      const timestamp = new Date();
      await setDoc(doc(db, "Rooms", roomNumber), {
        roomNumber: roomNumber,
        type: roomType,
        status: "Available",
        createdAt: timestamp,
        updatedAt: timestamp,
        currentBookingID: null
      });

      Alert.alert("Success", `Room ${roomNumber} added!`);
      setRoomNumber(''); // Clear input
    } catch (error) {
      Alert.alert("DB Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput 
        placeholder="Room Number (e.g., 101)" 
        style={styles.input} 
        value={roomNumber}
        onChangeText={setRoomNumber}
        keyboardType="numeric"
      />
      
      <Picker
        selectedValue={roomType}
        onValueChange={(itemValue) => setRoomType(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Standard" value="Standard" />
        <Picker.Item label="Deluxe" value="Deluxe" />
        <Picker.Item label="Suite" value="Suite" />
      </Picker>

      <Button title="Register Room" onPress={handleAddRoom} color="#27ae60" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderBottomWidth: 1, marginBottom: 20, padding: 10 },
  picker: { height: 50, marginBottom: 50 }
});