import { useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

export const useAutomatedTriggers = () => {
  useEffect(() => {
    const runTriggers = async () => {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const batch = writeBatch(db);
      let updatesFound = false;

      // 1. ARRIVAL TRIGGER: Check for reservations starting today
      const arrivalsQuery = query(
        collection(db, "Bookings"), 
        where("checkInDate", "==", today),
        where("status", "==", "Reserved")
      );

      const arrivalSnap = await getDocs(arrivalsQuery);
      arrivalSnap.forEach((booking) => {
        const roomRef = doc(db, "Rooms", booking.data().roomNumber);
        batch.update(roomRef, { status: "Occupied", currentBookingID: booking.id });
        batch.update(doc(db, "Bookings", booking.id), { status: "Active" });
        updatesFound = true;
      });

      // 2. DEPARTURE TRIGGER: Check for stays that ended yesterday
      const departuresQuery = query(
        collection(db, "Bookings"),
        where("checkOutDate", "<", today),
        where("status", "==", "Active")
      );

      const departureSnap = await getDocs(departuresQuery);
      departureSnap.forEach((booking) => {
        const roomRef = doc(db, "Rooms", booking.data().roomNumber);
        batch.update(roomRef, { status: "Dirty", currentBookingID: null });
        batch.update(doc(db, "Bookings", booking.id), { status: "Completed" });
        updatesFound = true;
      });

      if (updatesFound) {
        await batch.commit();
        console.log("Automated status updates applied.");
      }
    };

    runTriggers();
  }, []);
};

import { serverTimestamp } from 'firebase/firestore';

// When checking in:
await updateDoc(roomRef, {
  lastUpdated: serverTimestamp(), // Uses Google's server time, not the phone's
  status: "Occupied"
});