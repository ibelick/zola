import {
  createStore,
  del,
  delMany,
  get,
  getMany,
  keys,
  setMany,
} from "idb-keyval"

let dbInitPromise: Promise<void> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stores: Record<string, any> = {}

const isClient = typeof window !== "undefined"
const DB_NAME = "zola-db"
const DB_VERSION = 2

let storesReady = false
let storesReadyResolve: () => void = () => {}
const storesReadyPromise = new Promise<void>((resolve) => {
  storesReadyResolve = resolve
})

function initDatabase() {
  if (!isClient) return Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("chats")) db.createObjectStore("chats")
      if (!db.objectStoreNames.contains("messages"))
        db.createObjectStore("messages")
      if (!db.objectStoreNames.contains("sync")) db.createObjectStore("sync")
    }

    request.onsuccess = () => {
      request.result.close()
      resolve()
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

if (isClient) {
  const checkRequest = indexedDB.open(DB_NAME)

  checkRequest.onsuccess = () => {
    const db = checkRequest.result
    if (db.version > DB_VERSION) {
      db.close()
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
      deleteRequest.onsuccess = () => {
        initDatabaseAndStores()
      }
      deleteRequest.onerror = (event) => {
        console.error("Database deletion failed:", event)
        initDatabaseAndStores()
      }
    } else {
      db.close()
      initDatabaseAndStores()
    }
  }

  checkRequest.onerror = () => {
    initDatabaseAndStores()
  }
}

function initDatabaseAndStores(): void {
  dbInitPromise = initDatabase()

  dbInitPromise
    .then(() => {
      const openRequest = indexedDB.open(DB_NAME)

      openRequest.onsuccess = () => {
        const objectStores = Array.from(openRequest.result.objectStoreNames)

        if (objectStores.length === 0) {
          openRequest.result.close()

          // Delete and recreate the database to force onupgradeneeded
          const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
          deleteRequest.onsuccess = () => {
            dbInitPromise = initDatabase() // Reinitialize with proper stores
            dbInitPromise.then(() => {
              // Try opening again to create stores
              const reopenRequest = indexedDB.open(DB_NAME)
              reopenRequest.onsuccess = () => {
                const newObjectStores = Array.from(
                  reopenRequest.result.objectStoreNames
                )

                if (newObjectStores.includes("chats"))
                  stores.chats = createStore(DB_NAME, "chats")
                if (newObjectStores.includes("messages"))
                  stores.messages = createStore(DB_NAME, "messages")
                if (newObjectStores.includes("sync"))
                  stores.sync = createStore(DB_NAME, "sync")

                storesReady = true
                storesReadyResolve()
                reopenRequest.result.close()
              }

              reopenRequest.onerror = (event) => {
                console.error(
                  "Failed to reopen database after recreation:",
                  event
                )
                storesReady = true
                storesReadyResolve()
              }
            })
          }

          return // Skip the rest of this function
        }

        // Continue with existing logic for when stores are found
        if (objectStores.includes("chats"))
          stores.chats = createStore(DB_NAME, "chats")
        if (objectStores.includes("messages"))
          stores.messages = createStore(DB_NAME, "messages")
        if (objectStores.includes("sync"))
          stores.sync = createStore(DB_NAME, "sync")

        storesReady = true
        storesReadyResolve()
        openRequest.result.close()
      }

      openRequest.onerror = (event) => {
        console.error("Failed to open database for store creation:", event)
        storesReady = true
        storesReadyResolve()
      }
    })
    .catch((error) => {
      console.error("Database initialization failed:", error)
      storesReady = true
      storesReadyResolve()
    })
}

export async function ensureDbReady() {
  if (!isClient) {
    console.warn("ensureDbReady: not client")
    return
  }
  if (dbInitPromise) await dbInitPromise
  if (!storesReady) await storesReadyPromise
}

export async function readFromIndexedDB<T>(
  table: "chats" | "messages" | "sync",
  key?: string
): Promise<T | T[]> {
  await ensureDbReady()

  if (!isClient) {
    console.warn("readFromIndexedDB: not client")
    return key ? (null as T) : []
  }

  if (!stores[table]) {
    console.warn("readFromIndexedDB: store not initialized")
    return key ? (null as T) : []
  }

  try {
    const store = stores[table]
    if (key) {
      const result = await get<T>(key, store)
      return result as T
    }

    const allKeys = await keys(store)
    if (allKeys.length > 0) {
      const results = await getMany<T>(allKeys as string[], store)
      return results.filter(Boolean)
    }

    return []
  } catch (error) {
    console.warn(`readFromIndexedDB failed (${table}):`, error)
    return key ? (null as T) : []
  }
}

export async function writeToIndexedDB<T extends { id: string | number }>(
  table: "chats" | "messages" | "sync",
  data: T | T[]
): Promise<void> {
  await ensureDbReady()

  if (!isClient) {
    console.warn("writeToIndexedDB: not client")
    return
  }

  if (!stores[table]) {
    console.warn("writeToIndexedDB: store not initialized")
    return
  }

  try {
    const store = stores[table]
    const entries: [IDBValidKey, T][] = Array.isArray(data)
      ? data.map((item) => [item.id, item])
      : [[data.id, data]]

    await setMany(entries, store)
  } catch (error) {
    console.warn(`writeToIndexedDB failed (${table}):`, error)
  }
}

export async function deleteFromIndexedDB(
  table: "chats" | "messages" | "sync",
  key?: string
): Promise<void> {
  await ensureDbReady()

  if (!isClient) {
    console.warn("deleteFromIndexedDB: not client")
    return
  }

  const store = stores[table]
  if (!store) {
    console.warn(`Store '${table}' not initialized.`)
    return
  }

  try {
    if (key) {
      await del(key, store)
    } else {
      const allKeys = await keys(store)
      await delMany(allKeys as string[], store)
    }
  } catch (error) {
    console.error(`Error deleting from IndexedDB store '${table}':`, error)
  }
}

export async function clearAllIndexedDBStores() {
  if (!isClient) {
    console.warn("clearAllIndexedDBStores: not client")
    return
  }

  await ensureDbReady()
  await deleteFromIndexedDB("chats")
  await deleteFromIndexedDB("messages")
  await deleteFromIndexedDB("sync")
}
