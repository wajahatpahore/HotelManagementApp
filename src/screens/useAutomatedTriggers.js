import { useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

export const useAutomatedTriggers = () => {
  useEffect(() => {
    const runTriggers = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight for date comparison
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
          batch.update(roomRef, { 
            status: "Occupied", 
            currentBookingID: booking.id,
            lastUpdated: serverTimestamp()
          });
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
          batch.update(roomRef, { 
            status: "Dirty", 
            currentBookingID: null,
            lastUpdated: serverTimestamp()
          });
          batch.update(doc(db, "Bookings", booking.id), { status: "Completed" });
          updatesFound = true;
        });

        if (updatesFound) {
          await batch.commit();
          console.log("✅ Automated status updates applied");
        }
      } catch (error) {
        console.error("❌ Error in automated triggers:", error.message);
      }
    };

    runTriggers();
  }, []);
};