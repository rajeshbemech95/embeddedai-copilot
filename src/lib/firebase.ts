import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  User,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDocFromServer 
} from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

// Setup Firebase App
const app: FirebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfigJson) 
  : getApp();

export const auth = getAuth(app);
// Set local persistence
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Configure Firestore with custom databaseId if specified
export const db: Firestore = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google sign in error:", error);
    throw error;
  }
}

export async function logOut() {
  await fbSignOut(auth);
}

// Connection tester recommended by Firestore skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error?.message?.includes("the client is offline")) {
      console.warn("Firestore connection: client offline or configuration pending.");
    }
  }
}

export { app, onAuthStateChanged };
export type { User };
