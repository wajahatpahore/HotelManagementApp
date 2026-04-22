import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAutomatedTriggers } from './useAutomatedTriggers';

export default function Dashboard({ navigation }) {
  const [rooms, setRooms] = useState([]);
  
  // Call the automated triggers hook
  useAutomatedTriggers();

  useEffect(() => {
    // Real-time listener for Rooms collection
    const unsubscribe = onSnapshot(collection(db, "Rooms"), (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomList);
    });
    return () => unsubscribe();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#2ecc71'; // Green
      case 'Occupied': return '#e74c3c';  // Red
      case 'Dirty': return '#f39c12';     // Orange
      default: return '#95a5a6';
    }
  };

  const renderRoom = ({ item }) => (
    <TouchableOpacity 
      style={[styles.tile, { backgroundColor: getStatusColor(item.status) }]}
      onPress={() => navigation.navigate('RoomDetails', { roomID: item.id })}
    >
      <Text style={styles.roomNum}>{item.roomNumber}</Text>
      <Text style={styles.roomType}>{item.type}</Text>
      <Text style={styles.statusText}>{item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hotel Status Dashboard</Text>
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={item => item.id}
        numColumns={2} // Creates the grid layout
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f6fa' },
  header: { fontSize: 22, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
  tile: {
    flex: 1,
    margin: 8,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  roomNum: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  roomType: { color: '#fff', fontSize: 14, opacity: 0.9 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 5 }
});

import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// Inside your Dashboard Component:
const [rooms, setRooms] = useState([]);

useEffect(() => {
  // Create a query to order rooms numerically
  const q = query(collection(db, "Rooms"), orderBy("roomNumber", "asc"));

  // Set up the real-time listener
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const updatedRooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setRooms(updatedRooms);
    console.log("Real-time update received for rooms!");
  }, (error) => {
    console.error("Listener failed: ", error);
  });

  // CLEANUP: Stop listening when the user leaves the screen
  return () => unsubscribe();
}, []);

useEffect(() => {
  const q = query(collection(db, "Rooms"), orderBy("roomNumber", "asc"));
  
  // Start listener
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const roomData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRooms(roomData);
  });

  // CRITICAL: This stops the listener when the component unmounts
  return () => unsubscribe(); 
}, []);

onSnapshot(q, (snapshot) => {
  const source = snapshot.metadata.fromCache ? "local cache" : "server";
  console.log("Data coming from: ", source); // If this stays 'local cache', sync is broken.
});

const getStatusColor = (status) => {
  switch (status) {
    case 'Available': return '#2ecc71'; // Green
    case 'Occupied':  return '#e74c3c'; // Red
    case 'Dirty':     return '#e67e22'; // Orange
    case 'Cleaning':  return '#3498db'; // Blue
    default:          return '#95a5a6'; // Grey
  }
};

// Helper function for status colors
const getStatusStyles = (status) => {
  switch (status) {
    case 'Available':
      return { backgroundColor: '#27ae60', label: 'AVAILABLE' };
    case 'Occupied':
      return { backgroundColor: '#e74c3c', label: 'OCCUPIED' };
    case 'Dirty':
      return { backgroundColor: '#f39c12', label: 'DIRTY' };
    case 'Cleaning':
      return { backgroundColor: '#3498db', label: 'CLEANING' };
    default:
      return { backgroundColor: '#7f8c8d', label: 'UNKNOWN' };
  }
};

// Inside your RenderItem function
const renderRoom = ({ item }) => {
  const statusStyle = getStatusStyles(item.status);

  return (
    <TouchableOpacity 
      style={[styles.roomTile, { backgroundColor: statusStyle.backgroundColor }]}
      onPress={() => handleRoomPress(item)}
    >
      <View style={styles.tileHeader}>
        <Text style={styles.roomNumber}>{item.roomNumber}</Text>
        <Text style={styles.roomType}>{item.type}</Text>
      </View>
      <Text style={styles.statusLabel}>{statusStyle.label}</Text>
    </TouchableOpacity>
  );
};

// Pseudo-logic for Status Trigger
const today = new Date().toDateString();
const q = query(collection(db, "Bookings"), where("checkInDate", "==", today), where("status", "==", "Reserved"));

const triggerArrivals = async () => {
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((booking) => {
    const roomRef = doc(db, "Rooms", booking.data().roomNumber);
    updateDoc(roomRef, { status: "Occupied", currentBookingID: booking.id });
  });
};