import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';

interface SQLiteContextType {
    db: any;
    execAsync: (query: string) => Promise<void>;
    withTransactionAsync: (callback: () => Promise<T>) => Promise<T>;
    withExclusiveTransactionAsync: <T>(callback: () => Promise<T>) => Promise<T>;
    runAsync: (query: string, ...params: any[]) => Promise<{ lastInsertRowId: number; changes: number }>;
    getFirstAsync: <T>(query: string, ...params: any[]) => Promise<T | null>;
    getAllAsync: <T>(query: string, ...params: any[]) => Promise<T[]>;
}

const SQLiteContext = createContext<SQLiteContextType | undefined>(undefined);

interface SQLiteProviderProps {
    children: ReactNode;
    databaseName?: string;
    onInit?: (db: any) => Promise<void>;
}

const openIndexedDB = (databaseName: string): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('databases')) {
                db.createObjectStore('databases');
            }
        };
    });
};

const loadDatabaseFromIndexedDB = async (databaseName: string): Promise<Uint8Array | null> => {
    try {
        const idb = await openIndexedDB(databaseName);
        return new Promise((resolve, reject) => {
            const transaction = idb.transaction(['databases'], 'readonly');
            const store = transaction.objectStore('databases');
            const request = store.get(databaseName);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error loading from IndexedDB:', error);
        return null;
    }
};

const saveDatabaseToIndexedDB = async (databaseName: string, data: Uint8Array): Promise<void> => {
    try {
        const idb = await openIndexedDB(databaseName);
        return new Promise((resolve, reject) => {
            const transaction = idb.transaction(['databases'], 'readwrite');
            const store = transaction.objectStore('databases');
            const request = store.put(data, databaseName);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error saving to IndexedDB:', error);
    }
};

const loadDB = async (databaseName: string): Promise<Uint8Array | null> => await loadDatabaseFromIndexedDB(databaseName);

const saveDB = async (databaseName: string, db: any): Promise<void> => await saveDatabaseToIndexedDB(databaseName, db.export());

export const openDatabaseAsync = async (databaseName: string, options?: any): Promise<SQLiteDatabase> => {
    const { default: initSqlJs } = await import('sql.js');
    const SQL = await initSqlJs({
        locateFile: (file) => `/lib/sql.js/${file}`,
    });
    const savedData = await loadDB(databaseName);
    const database = savedData ? new SQL.Database(savedData) : new SQL.Database();

    return {
        db: database,
        //TODO: isInTransactionAsync
        //TODO: isInTransactionSync
        //TODO: closeAsync
        //TODO: closeSync
        execAsync: async (query: string) => {
            database.exec(query);
            // saveDB(databaseName,database);
        },
        //TODO: execSync
        //TODO: serializeAsync
        //TODO: serializeSync
        //TODO: prepareAsync
        //TODO: prepareSync
        //TODO: withTransactionAsync
        withTransactionAsync: async (callback: () => Promise<void>) => {
            try {
                database.run('BEGIN TRANSACTION');
                const result = await callback();
                database.run('COMMIT');
                saveDB(databaseName, database);
                return result;
            } catch (err) {
                database.run('ROLLBACK');
                throw err;
            }
        },
        //TODO: withTransactionSync
        withExclusiveTransactionAsync: async <T,>(callback: () => Promise<T>): Promise<T> => {
            try {
                database.run('BEGIN TRANSACTION');
                const result = await callback();
                database.run('COMMIT');
                saveDB(databaseName, database);
                return result;
            } catch (err) {
                database.run('ROLLBACK');
                throw err;
            }
        },
        //TODO: withExclusiveTransactionSync
        runAsync: async (query: string, ...params: any[]) => {
            database.run(query, params);
            const result = {
                lastInsertRowId: database.exec('SELECT last_insert_rowid()')[0].values[0][0] as number,
                changes: database.getRowsModified(),
            };
            saveDB(databaseName, database);
            return result;
        },
        //TODO: runSync
        getFirstAsync: async <T,>(query: string, ...params: any[]) => {
            const stmt = database.prepare(query);
            stmt.bind(params);
            let result: T | null = null;
            if (stmt.step()) {
                result = stmt.getAsObject() as T;
            }
            stmt.free();
            return result;
        },
        //TODO: getFirstSync
        //TODO: getEachAsync
        //TODO: getEachSync
        getAllAsync: async <T,>(query: string, ...params: any[]) => {
            const stmt = database.prepare(query);
            stmt.bind(params);
            const results: T[] = [];
            while (stmt.step()) {
                const row = stmt.getAsObject();
                results.push(row as T);
            }
            stmt.free();
            return results;
        },
        //TODO: getAllSync
        //TODO: syncLibSQL
    } as SQLiteContextType;
}

//TODO: openDatabaseSync
//TODO: deserializeDatabaseAsync
//TODO: deserializeDatabaseSync
//TODO: deleteDatabaseAsync
//TODO: deleteDatabaseSync
//TODO: addDatabaseChangeListener

export const SQLiteProvider: React.FC<SQLiteProviderProps> = ({
    children,
    databaseName = 'sqlite.db',
    onInit,
}) => {
    const [db, setDb] = useState<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        openDatabaseAsync(databaseName).then(async (database) => {
            if (database) {
                if (onInit) await onInit(database);
                setDb(database);
            }
        });
    }, [onInit]);

    return (
        db && <SQLiteContext.Provider value={db}>
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
