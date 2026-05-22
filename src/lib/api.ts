import { db, auth } from './firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, serverTimestamp, or } from 'firebase/firestore';
import { Letter } from '../types';

let dbType: 'firebase' | 'mysql' = 'firebase';

// Fetch config from server to know which DB to use
async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    dbType = data.dbType;
  } catch (err) {
    console.error('Failed to fetch config, defaulting to firebase', err);
  }
}

fetchConfig();

export const getDbType = () => dbType;

export async function sendLetter(letterData: Partial<Letter>) {
  if (dbType === 'mysql') {
    const res = await fetch('/api/letters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(letterData),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } else {
    return await addDoc(collection(db, 'letters'), {
      ...letterData,
      createdAt: serverTimestamp(),
    });
  }
}

export async function updateLetter(id: string, data: Partial<Letter>) {
  if (dbType === 'mysql') {
    const res = await fetch(`/api/letters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } else {
    return await updateDoc(doc(db, 'letters', id), {
      ...data,
      repliedAt: data.replyEncryptedContent ? serverTimestamp() : undefined
    });
  }
}

export async function getRecipientUid(username: string) {
  if (dbType === 'mysql') {
    const res = await fetch(`/api/users/${username.toLowerCase()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.uid;
  } else {
    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
    if (usernameDoc.exists()) {
      return usernameDoc.data().uid;
    }
    return null;
  }
}


// Letters subscription helper
export function subscribeToLetters(userId: string, callback: (letters: Letter[]) => void) {
  if (dbType === 'mysql') {
    // Single fetch for MySQL in this simple implementation
    // A real app might use polling or WebSockets
    const fetchMysql = async () => {
      try {
        const res = await fetch(`/api/letters/${userId}`);
        const data = await res.json();
        callback(data);
      } catch (err) {
        console.error('MySQL Fetch Error:', err);
      }
    };
    fetchMysql();
    const interval = setInterval(fetchMysql, 10000); // Poll every 10s
    return () => clearInterval(interval);
  } else {
    const q = query(
      collection(db, 'letters'),
      or(
        where('toUserId', '==', userId),
        where('fromUserId', '==', userId)
      ),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const letters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Letter[];
      callback(letters);
    });
  }
}
