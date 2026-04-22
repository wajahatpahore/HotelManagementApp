import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default function ReservationScreen({ route, navigation }) {
  const { roomNumber } = route.params;
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const handleReserve = async () => {
    try {
      // 1. Conflict Check for Future Dates
      const q = query(
        collection(db, "Bookings"),
        where("roomNumber", "==", roomNumber),
        where("checkInDate", "==", date.toDateString()) 
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        Alert.alert("Conflict", "This room is already reserved for this date.");
        return;
      }

      // 2. Save Reservation
      await addDoc(collection(db, "Bookings"), {
        roomNumber,
        checkInDate: date.toDateString(),
        status: "Reserved",
        guestName: "To Be Provided at Check-in"
      });

      Alert.alert("Success", `Room ${roomNumber} reserved for ${date.toDateString()}`);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reserve Room {roomNumber}</Text>
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
  dateDisplay: { marginVertical: 20, fontSize: 16, color: '#2c3e50' }
});