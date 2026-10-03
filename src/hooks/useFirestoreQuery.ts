import { useState, useEffect, useRef } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData 
} from 'firebase/firestore';

/**
 * A generic hook to subscribe to a Firestore query in real-time.
 * @param query The Firestore query to listen to.
 * @returns An object containing the data, loading state, and error.
 */
export function useFirestoreQuery<T = DocumentData>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to keep track of the current query to avoid unnecessary re-subscriptions
  const queryRef = useRef<Query<DocumentData> | null>(null);

  useEffect(() => {
    // If query is null or hasn't changed, do nothing
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
