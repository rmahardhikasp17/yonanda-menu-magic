/**
 * Centralized Database Provider
 *
 * Wraps the app root to ensure initDB() is called exactly once.
 * All hooks can safely use db operations without calling initDB() themselves.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initDB } from '@/lib/db';

interface DBContextValue {
  isReady: boolean;
  error: string | null;
}

const DBContext = createContext<DBContextValue>({
  isReady: false,
  error: null,
});

/**
 * Hook to check if the database is ready
 */
export function useDB(): DBContextValue {
  return useContext(DBContext);
}

interface DBProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Database initialization provider
 *
 * Usage in App.tsx:
 * ```tsx
 * <DBProvider fallback={<LoadingScreen />}>
 *   <RouterProvider router={router} />
 * </DBProvider>
 * ```
 */
export function DBProvider({ children, fallback }: DBProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        setIsReady(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize database';
        setError(message);
        console.error('[DBProvider] Init failed:', err);
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-red-600 mb-2">Database Error</h2>
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Memuat database...</p>
        </div>
      </div>
    );
  }

  return (
    <DBContext.Provider value={{ isReady, error }}>
      {children}
    </DBContext.Provider>
  );
}
