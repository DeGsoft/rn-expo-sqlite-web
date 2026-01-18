import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';

interface SQLiteContextType {
    db: any;
    isReady: boolean;
    withExclusiveTransactionAsync: <T>(callback: () => Promise<T>) => Promise<T>;
    runAsync: (query: string, ...params: any[]) => Promise<void>;
    getAllAsync: <T>(query: string, ...params: any[]) => Promise<T[]>;
}

const SQLiteContext = createContext<SQLiteContextType | undefined>(undefined);

interface SQLiteProviderProps {
    children: ReactNode;
    databaseName?: string;
    onInit?: (db: any) => Promise<void>;
}

export const SQLiteProvider: React.FC<SQLiteProviderProps> = ({
    children,
    databaseName = 'db.db',
    onInit,
}) => {
    const [db, setDb] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);
    const dbRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        import('sql.js').then(({ default: initSqlJs }) => {
            initSqlJs({
                locateFile: (file) => `/lib/sql.js/${file}`,
            }).then(async (SQL) => {
                const database = new SQL.Database();
                
                if (onInit) {
                    await onInit(database);
                }
                
                dbRef.current = database;
                setDb(database);
                setIsReady(true);
            });
        });
    }, [onInit]);

    const waitForDb = (): Promise<any> => {
        return new Promise((resolve) => {
            if (dbRef.current) {
                resolve(dbRef.current);
            } else {
                const interval = setInterval(() => {
                    if (dbRef.current) {
                        clearInterval(interval);
                        resolve(dbRef.current);
                    }
                }, 50);
            }
        });
    };

    const withExclusiveTransactionAsync = async <T,>(callback: () => Promise<T>): Promise<T> => {
        const database = await waitForDb();
        
        try {
            database.run('BEGIN TRANSACTION');
            const result = await callback();
            database.run('COMMIT');
            return result;
        } catch (error) {
            database.run('ROLLBACK');
            throw error;
        }
    };

    const runAsync = async (query: string, ...params: any[]): Promise<void> => {
        const database = await waitForDb();
        database.run(query, params);
    };

    const getAllAsync = async <T,>(query: string, ...params: any[]): Promise<T[]> => {
        const database = await waitForDb();
        
        const stmt = database.prepare(query);
        stmt.bind(params);
        
        const results: T[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(row as T);
        }
        stmt.free();
        
        return results;
    };

    return (
        <SQLiteContext.Provider value={{ 
            db, 
            isReady, 
            withExclusiveTransactionAsync,
            runAsync,
            getAllAsync
        }}>
            {children}
        </SQLiteContext.Provider>
    );
};

export const useSQLiteContext = (): SQLiteContextType => {
    const context = useContext(SQLiteContext);
    if (!context) {
        throw new Error('useSQLiteContext must be used within SQLiteProvider');
    }
    return context;
};

export type SQLiteDatabase = SQLiteContextType;
