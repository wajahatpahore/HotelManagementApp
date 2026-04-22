import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';

export default function CheckInScreen({ route, navigation }) {
  const { roomID, roomNumber } = route.params; // Passed from Dashboard
  
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [days, setDays] = useState('1');

  const handleSecureCheckIn = async () => {
  const roomRef = doc(db, "Rooms", roomID);

  try {
    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      
      if (!roomDoc.exists()) {
        throw "Room does not exist!";
      }

      const currentStatus = roomDoc.data().status;

      // CONFLICT CHECK TRIGGER
      if (currentStatus !== 'Available') {
        throw `Conflict: Room ${roomNumber} is currently ${currentStatus}.`;
      }

      // If Available, proceed with updates
      const newBookingRef = doc(collection(db, "Bookings"));
      
      transaction.set(newBookingRef, {
        guestName,
        guestContact,
        roomNumber,
        checkInDate: new Date(),
        status: "Active"
      });

      transaction.update(roomRef, {
        status: "Occupied",
        currentBookingID: newBookingRef.id
      });
    });

    Alert.alert("Success", "Check-in completed successfully.");
    navigation.goBack();

  } catch (e) {
    Alert.alert("Booking Blocked", e.toString());
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Check-in: Room {roomNumber}</Text>
      
      <TextInput 
        placeholder="Guest Full Name" 
        style={styles.input} 
        onChangeText={setGuestName} 
      />
      
      <TextInput 
        placeholder="Contact Number" 
        style={styles.input} 
        keyboardType="phone-pad"
        onChangeText={setGuestContact} 
      />
      
      <TextInput 
        placeholder="Number of Days" 
        style={styles.input} 
        keyboardType="numeric"
        value={days}
        onChangeText={setDays} 
      />

      <Button title="Confirm Check-in" onPress={handleSecureCheckIn} color="#27ae60" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderBottomWidth: 1, marginBottom: 25, padding: 8, fontSize: 16 }
});