import { useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

export const useAutomatedTriggers = () => {
  useEffect(() => {
    const runTriggers = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const batch = writeBatch(db);
        let updatesFound = false;

        // 1. ARRIVAL TRIGGER: Check for reservations with checkInDate between today and tomorrow
        const arrivalsQuery = query(
          collection(db, "Bookings"), 
          where("checkInDate", ">=", today),
          where("checkInDate", "<", tomorrow),
          where("status", "==", "Reserved")
        );

        try {
          const arrivalSnap = await getDocs(arrivalsQuery);
          arrivalSnap.forEach((booking) => {
            const roomNumber = booking.data().roomNumber?.toString();
            if (roomNumber) {
              const roomRef = doc(db, "Rooms", roomNumber);
              batch.update(roomRef, { 
                status: "Occupied", 
                currentBookingID: booking.id,
                lastUpdated: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              batch.update(doc(db, "Bookings", booking.id), { 
                status: "Active",
                updatedAt: serverTimestamp()
              });
              updatesFound = true;
            }
          });
        } catch (arrivalError) {
          console.warn("Arrival trigger query issue:", arrivalError.message);
        }

        // 2. DEPARTURE TRIGGER: Check for stays that ended yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const departuresQuery = query(
          collection(db, "Bookings"),
          where("checkOutDate", "<", today),
          where("status", "==", "Active")
        );

        try {
          const departureSnap = await getDocs(departuresQuery);
          departureSnap.forEach((booking) => {
            const roomNumber = booking.data().roomNumber?.toString();
            if (roomNumber) {
              const roomRef = doc(db, "Rooms", roomNumber);
              batch.update(roomRef, { 
                status: "Dirty", 
                currentBookingID: null,
                lastUpdated: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              batch.update(doc(db, "Bookings", booking.id), { 
                status: "Completed",
                updatedAt: serverTimestamp()
              });
              updatesFound = true;
            }
          });
        } catch (departureError) {
          console.warn("Departure trigger query issue:", departureError.message);
        }

        if (updatesFound) {
          await batch.commit();
          console.log("✅ Automated status updates applied");
        }
      } catch (error) {
        console.error("❌ Error in automated triggers:", error.message);
      }
    };

    // Run triggers on component mount and every hour
    runTriggers();
    const interval = setInterval(runTriggers, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
};