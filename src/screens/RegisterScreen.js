import { db, auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Inside your handleRegister function:
const handleRegister = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Save role to Firestore 'Users' collection
    await setDoc(doc(db, "Users", user.uid), {
      name: name,
      email: email,
      role: role // "Admin" or "Housekeeping"
    });
    
    Alert.alert("Success", "Account created!");
  } catch (error) {
    Alert.alert("Registration Error", error.message);
  }
};