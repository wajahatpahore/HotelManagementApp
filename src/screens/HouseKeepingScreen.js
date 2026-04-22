import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function HousekeepingScreen() {
  const [dirtyRooms, setDirtyRooms] = useState([]);

  useEffect(() => {
    // Only fetch rooms that need attention (Dirty or Cleaning)
    const q = query(collection(db, "Rooms"), where("status", "in", ["Dirty", "Cleaning"]));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDirtyRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (roomID, currentStatus) => {
    const nextStatus = currentStatus === 'Dirty' ? 'Cleaning' : 'Available';
    const roomRef = doc(db, "Rooms", roomID);

    try {
      await updateDoc(roomRef, { status: nextStatus });
      Alert.alert("Status Updated", `Room is now ${nextStatus}`);
    } catch (error) {
      Alert.alert("Error", error.message);
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
      {dirtyRooms.length === 0 ? (
        <Text style={styles.emptyMsg}>All rooms are currently clean! ✨</Text>
      ) : (
        <FlatList data={dirtyRooms} renderItem={renderItem} keyExtractor={item => item.id} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
  roomText: { fontSize: 18, fontWeight: '600' },
  statusBadge: { marginVertical: 5, fontWeight: 'bold' },
  button: { marginTop: 10, padding: 12, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyMsg: { textAlign: 'center', marginTop: 50, color: '#7f8c8d', fontSize: 16 }
});