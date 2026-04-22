import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, doc, runTransaction } from 'firebase/firestore';

export default function CheckInScreen({ route, navigation }) {
  const { roomID, roomNumber } = route.params; // Passed from Dashboard
  const roomIDString = roomID?.toString() || roomNumber?.toString();
  
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [days, setDays] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleSecureCheckIn = async () => {
  const trimmedGuestName = guestName.trim();
  const trimmedGuestContact = guestContact.trim();
  const parsedDays = parseInt(days, 10);

  if (!roomIDString) {
    Alert.alert("Validation Error", "Room ID is missing.");
    return;
  }

  if (!trimmedGuestName || !trimmedGuestContact || !Number.isFinite(parsedDays) || parsedDays < 1) {
    Alert.alert("Validation Error", "Please enter a valid guest name, contact, and number of days.");
    return;
  }

  setLoading(true);
  const roomRef = doc(db, "Rooms", roomIDString);

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
      const now = new Date();
      
      transaction.set(newBookingRef, {
        guestName: trimmedGuestName,
        guestContact: trimmedGuestContact,
        roomNumber: roomNumber?.toString(),
        checkInDate: now,
        checkOutDate: new Date(now.getTime() + parsedDays * 24 * 60 * 60 * 1000),
        status: "Active",
        createdAt: now,
        updatedAt: now,
        totalAmount: 0,
        room: roomRef
      });

      transaction.update(roomRef, {
        status: "Occupied",
        currentBookingID: newBookingRef.id,
        updatedAt: now,
        lastUpdated: now
      });
    });

    Alert.alert("Success", "Check-in completed successfully.");
    setLoading(false);
    navigation.goBack();

  } catch (e) {
    setLoading(false);
    console.error("Check-in error:", e);
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

      <Button title={loading ? "Processing..." : "Confirm Check-in"} onPress={handleSecureCheckIn} color="#27ae60" disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderBottomWidth: 1, marginBottom: 25, padding: 8, fontSize: 16 }
});