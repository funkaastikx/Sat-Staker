import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVTmFXu90lDsNhv-scTNCo0v-Jwb3I7BE",
  authDomain: "sat-stacker-c366b.firebaseapp.com",
  projectId: "sat-stacker-c366b",
  storageBucket: "sat-stacker-c366b.firebasestorage.app",
  messagingSenderId: "331586729649",
  appId: "1:331586729649:web:3750dd6db41a74b51fd490"
};

const app = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logOut           = () => signOut(auth);

export const saveUserData = async (uid, data) => {
  await setDoc(doc(db, "users", uid), data, { merge: true });
};

export const loadUserData = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// Increments the global stacker count — _counted flag in user doc is the gatekeeper
export const incrementStackerCount = async () => {
  const metaRef = doc(db, "users", "_appMeta_");
  const metaSnap = await getDoc(metaRef);
  if (metaSnap.exists()) {
    await updateDoc(metaRef, { count: increment(1) });
  } else {
    await setDoc(metaRef, { count: 1 });
  }
  const updated = await getDoc(metaRef);
  return updated.data().count;
};

// Fetches the current stacker count without incrementing
export const getStackerCount = async () => {
  const metaRef = doc(db, "users", "_appMeta_");
  const snap = await getDoc(metaRef);
  return snap.exists() ? snap.data().count : 1;
};
