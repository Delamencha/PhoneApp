import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { getDatabase } from './database';

interface DatabaseContextValue {
  db: SQLite.SQLiteDatabase | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const database = await getDatabase();
        if (mounted) {
          setDb(database);
          setIsReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}
