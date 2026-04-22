import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default function ReservationScreen({ route, navigation }) {
  const { roomNumber } = route.params;
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');

  const handleReserve = async () => {
    try {
      if (!guestName.trim() || !guestContact.trim()) {
        Alert.alert('Validation Error', 'Please enter guest name and contact number.');
        return;
      }

      // Set time to midnight for consistent date comparison
      const reservationDate = new Date(date);
      reservationDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(reservationDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // 1. Conflict Check for Future Dates
      const q = query(
        collection(db, "Bookings"),
        where("roomNumber", "==", roomNumber.toString()),
        where("checkInDate", ">=", reservationDate),
        where("checkInDate", "<", nextDay),
        where("status", "in", ["Reserved", "Active"]) 
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        Alert.alert("Conflict", "This room is already reserved for this date.");
        return;
      }

      // 2. Save Reservation with proper Timestamp
      await addDoc(collection(db, "Bookings"), {
        roomNumber: roomNumber.toString(),
        checkInDate: reservationDate,
        checkOutDate: new Date(reservationDate.getTime() + 24 * 60 * 60 * 1000),
        status: "Reserved",
        guestName: guestName.trim(),
        guestContact: guestContact.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        totalAmount: 0
      });

      Alert.alert("Success", `Room ${roomNumber} reserved for ${reservationDate.toDateString()}`);
      navigation.goBack();
    } catch (error) {
      console.error("Reservation Error:", error);
      Alert.alert("Error", error.message || "Failed to create reservation");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reserve Room {roomNumber}</Text>
      <TextInput
        placeholder="Guest Name"
        style={styles.input}
        value={guestName}
        onChangeText={setGuestName}
      />
      <TextInput
        placeholder="Guest Contact"
        style={styles.input}
        value={guestContact}
        onChangeText={setGuestContact}
        keyboardType="phone-pad"
      />
      <Text>Select Arrival Date:</Text>
      <Button title="Open Calendar" onPress={() => setShow(true)} />
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShow(false);
            setDate(selectedDate || date);
          }}
        />
      )}
      <Text style={styles.dateDisplay}>Selected: {date.toDateString()}</Text>
      <Button title="Confirm Reservation" onPress={handleReserve} color="#3498db" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderBottomWidth: 1, marginBottom: 15, padding: 10, backgroundColor: '#fff', borderRadius: 5 },
  dateDisplay: { marginVertical: 20, fontSize: 16, color: '#2c3e50' }
});