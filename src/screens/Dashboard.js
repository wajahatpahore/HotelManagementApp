import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAutomatedTriggers } from './useAutomatedTriggers';

export default function Dashboard({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  
  // Call the automated triggers hook
  useAutomatedTriggers();

  useEffect(() => {
    try {
      // Real-time listener for Rooms collection
      const unsubscribe = onSnapshot(collection(db, "Rooms"), (snapshot) => {
        const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRooms(roomList);
      }, (err) => {
        console.log('Error loading rooms:', err.message);
        setError('Failed to load rooms: ' + err.message);
      });
      return () => unsubscribe();
    } catch (err) {
      console.log('Dashboard Error:', err.message);
      setError('Error: ' + err.message);
    }
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
      onPress={() => navigation.navigate('CheckIn', { roomID: item.id?.toString(), roomNumber: item.roomNumber?.toString() })}
    >
      <Text style={styles.roomNum}>{item.roomNumber}</Text>
      <Text style={styles.roomType}>{item.type}</Text>
      <Text style={styles.statusText}>{item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hotel Status Dashboard</Text>
      
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}
      
      {rooms.length === 0 && !error ? (
        <Text style={styles.noData}>No rooms found. Add rooms to get started.</Text>
      ) : null}
      
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={item => item.id}
        numColumns={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f6fa' },
  header: { fontSize: 22, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
  errorBox: { backgroundColor: '#fff3cd', borderLeftWidth: 4, borderLeftColor: '#ff9800', padding: 15, marginBottom: 15, borderRadius: 5 },
  errorText: { color: '#856404', fontSize: 13, fontWeight: '500' },
  noData: { textAlign: 'center', color: '#666', marginTop: 20, fontSize: 16 },
  tile: {
    flex: 1,
    margin: 8,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  roomNum: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  roomType: { color: '#fff', fontSize: 14, opacity: 0.9 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 5 }
});