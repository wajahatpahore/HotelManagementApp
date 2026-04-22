import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function HousekeepingScreen() {
  const [dirtyRooms, setDirtyRooms] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      // Only fetch rooms that need attention (Dirty or Cleaning)
      const q = query(collection(db, "Rooms"), where("status", "in", ["Dirty", "Cleaning"]));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setDirtyRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setError('');
      }, (err) => {
        console.error("Error loading dirty rooms:", err);
        setError("Failed to load rooms: " + err.message);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Housekeeping error:", err);
      setError("Error: " + err.message);
    }
  }, []);

  const updateStatus = async (roomID, currentStatus) => {
    const nextStatus = currentStatus === 'Dirty' ? 'Cleaning' : 'Available';
    const roomRef = doc(db, "Rooms", roomID?.toString());

    try {
      await updateDoc(roomRef, { 
        status: nextStatus,
        updatedAt: new Date()
      });
      Alert.alert("Status Updated", `Room is now ${nextStatus}`);
    } catch (error) {
      console.error("Status update error:", error);
      Alert.alert("Error", error.message || "Failed to update status");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.roomText}>Room {item.roomNumber} ({item.type})</Text>
      <Text style={[styles.statusBadge, { color: item.status === 'Dirty' ? '#e67e22' : '#3498db' }]}>
        CURRENTLY: {item.status.toUpperCase()}
      </Text>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: item.status === 'Dirty' ? '#3498db' : '#27ae60' }]}
        onPress={() => updateStatus(item.id, item.status)}
      >
        <Text style={styles.btnText}>
          {item.status === 'Dirty' ? "START CLEANING" : "FINISH & INSPECT"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Housekeeping Tasks</Text>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}
      {dirtyRooms.length === 0 && !error ? (
        <Text style={styles.emptyMsg}>All rooms are currently clean! ✨</Text>
      ) : null}
      {dirtyRooms.length > 0 && (
        <FlatList data={dirtyRooms} renderItem={renderItem} keyExtractor={item => item.id} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  errorBox: { backgroundColor: '#fff3cd', borderLeftWidth: 4, borderLeftColor: '#ff9800', padding: 15, marginBottom: 15, borderRadius: 5 },
  errorText: { color: '#856404', fontSize: 13, fontWeight: '500' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
  roomText: { fontSize: 18, fontWeight: '600' },
  statusBadge: { marginVertical: 5, fontWeight: 'bold' },
  button: { marginTop: 10, padding: 12, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyMsg: { textAlign: 'center', marginTop: 50, color: '#7f8c8d', fontSize: 16 }
});