import Dexie, { Table, type IndexableType } from 'dexie';

// Define interfaces for our data
export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  study_hours_goal: number;
  study_reminders: boolean;
  daily_digest: boolean;
  streak_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  task: string;
  duration: number;
  created_at: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  date: string;
  time_slot: string | null;
  completed: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  time: string;
  enabled: boolean;
  created_at: string;
}

type SqliteCallback = (data: { data: unknown; error: { message: string } | null }) => void;

type TableNames = 'users' | 'profiles' | 'study_sessions' | 'daily_tasks' | 'reminders';

type TableRecord<T extends TableNames> =
  T extends 'users' ? User :
  T extends 'profiles' ? Profile :
  T extends 'study_sessions' ? StudySession :
  T extends 'daily_tasks' ? DailyTask :
  Reminder;

// Database class
class ConsistencyDB extends Dexie {
  users!: Table<User>;
  profiles!: Table<Profile>;
  study_sessions!: Table<StudySession>;
  daily_tasks!: Table<DailyTask>;
  reminders!: Table<Reminder>;

  constructor() {
    super('consistency-db');
    this.version(1).stores({
      users: 'id, email',
      profiles: 'id, user_id',
      study_sessions: 'id, user_id, created_at',
      daily_tasks: 'id, user_id, date, completed',
      reminders: 'id, user_id, created_at'
    });
  }
}

const db = new ConsistencyDB();

// Initialize database
export const initDatabase = async () => {
  // Database is automatically initialized with Dexie
  return db;
};

// Simple password hashing (not secure, but for demo purposes)
const hashPassword = async (password: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Auth functions
export const auth = {
  signUp: async (email: string, password: string, fullName: string) => {
    await initDatabase();
    const passwordHash = await hashPassword(password);
    const userId = Date.now().toString();

    try {
      await db.users.add({
        id: userId,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        created_at: new Date().toISOString()
      });

      // Create default profile
      await db.profiles.add({
        id: 'profile-' + userId,
        user_id: userId,
        full_name: fullName,
        study_hours_goal: 4,
        study_reminders: true,
        daily_digest: true,
        streak_alerts: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return { data: { user: { id: userId, email, user_metadata: { full_name: fullName } } }, error: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: { message } };
    }
  },

  signIn: async (email: string, password: string) => {
    await initDatabase();
    const passwordHash = await hashPassword(password);

    try {
      const user = await db.users.where({ email, password_hash: passwordHash }).first();

      if (user) {
        return { data: { user: { id: user.id, email: user.email, user_metadata: { full_name: user.full_name } } }, error: null };
      } else {
        return { data: null, error: { message: 'Invalid email or password' } };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: { message } };
    }
  },

  signOut: async () => {
    // For local auth, just clear session
    localStorage.removeItem('current-user');
    return { error: null };
  },

  getUser: async () => {
    const userData = localStorage.getItem('current-user');
    if (userData) {
      return { data: { user: JSON.parse(userData) }, error: null };
    }
    return { data: null, error: null };
  },

  setUser: (user: Record<string, unknown>) => {
    localStorage.setItem('current-user', JSON.stringify(user));
  }
};

// Supabase-like query interface for compatibility
export const sqliteClient = {
  from: (tableName: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: string | number | boolean) => ({
        single: async () => {
          await initDatabase();
          let result;
          const equalsValue = value as IndexableType;
          if (tableName === 'users') result = await db.users.where(column).equals(equalsValue).first();
          else if (tableName === 'profiles') result = await db.profiles.where(column).equals(equalsValue).first();
          else if (tableName === 'study_sessions') result = await db.study_sessions.where(column).equals(equalsValue).first();
          else if (tableName === 'daily_tasks') result = await db.daily_tasks.where(column).equals(equalsValue).first();
          else if (tableName === 'reminders') result = await db.reminders.where(column).equals(equalsValue).first();

          return { data: result || null, error: null };
        },
        order: (orderColumn: string, options?: { ascending?: boolean }) => ({
          limit: (n: number) => ({
            then: async (callback: SqliteCallback) => {
              await initDatabase();
              let query;
              const equalsValue = value as IndexableType;
              if (tableName === 'users') query = db.users.where(column).equals(equalsValue);
              else if (tableName === 'profiles') query = db.profiles.where(column).equals(equalsValue);
              else if (tableName === 'study_sessions') query = db.study_sessions.where(column).equals(equalsValue);
              else if (tableName === 'daily_tasks') query = db.daily_tasks.where(column).equals(equalsValue);
              else if (tableName === 'reminders') query = db.reminders.where(column).equals(equalsValue);

              if (query) {
                const results = await query.sortBy(orderColumn);
                const limited = options?.ascending === false ? results.reverse().slice(0, n) : results.slice(0, n);
                callback({ data: limited, error: null });
              } else {
                callback({ data: [], error: null });
              }
            }
          })
        }),
        then: async (callback: SqliteCallback) => {
          await initDatabase();
          let query;
          const equalsValue = value as IndexableType;
          if (tableName === 'users') query = db.users.where(column).equals(equalsValue);
          else if (tableName === 'profiles') query = db.profiles.where(column).equals(equalsValue);
          else if (tableName === 'study_sessions') query = db.study_sessions.where(column).equals(equalsValue);
          else if (tableName === 'daily_tasks') query = db.daily_tasks.where(column).equals(equalsValue);
          else if (tableName === 'reminders') query = db.reminders.where(column).equals(equalsValue);

          if (query) {
            const results = await query.toArray();
            callback({ data: results, error: null });
          } else {
            callback({ data: [], error: null });
          }
        }
      }),
      order: (orderColumn: string, options?: { ascending?: boolean }) => ({
        then: async (callback: SqliteCallback) => {
          await initDatabase();
          let results = [];
          if (tableName === 'users') results = await db.users.orderBy(orderColumn).toArray();
          else if (tableName === 'profiles') results = await db.profiles.orderBy(orderColumn).toArray();
          else if (tableName === 'study_sessions') results = await db.study_sessions.orderBy(orderColumn).toArray();
          else if (tableName === 'daily_tasks') results = await db.daily_tasks.orderBy(orderColumn).toArray();
          else if (tableName === 'reminders') results = await db.reminders.orderBy(orderColumn).toArray();

          if (options?.ascending === false) results.reverse();
          callback({ data: results, error: null });
        }
      }),
      then: async (callback: SqliteCallback) => {
        await initDatabase();
        let results = [];
        if (tableName === 'users') results = await db.users.toArray();
        else if (tableName === 'profiles') results = await db.profiles.toArray();
        else if (tableName === 'study_sessions') results = await db.study_sessions.toArray();
        else if (tableName === 'daily_tasks') results = await db.daily_tasks.toArray();
        else if (tableName === 'reminders') results = await db.reminders.toArray();

        callback({ data: results, error: null });
      }
    }),
    insert: (data: Record<string, unknown>) => ({
      then: async (callback: SqliteCallback) => {
        await initDatabase();
        try {
          let id;
          if (tableName === 'users') id = await db.users.add(data as unknown as User);
          else if (tableName === 'profiles') id = await db.profiles.add(data as unknown as Profile);
          else if (tableName === 'study_sessions') id = await db.study_sessions.add(data as unknown as StudySession);
          else if (tableName === 'daily_tasks') id = await db.daily_tasks.add(data as unknown as DailyTask);
          else if (tableName === 'reminders') id = await db.reminders.add(data as unknown as Reminder);

          callback({ data: { id }, error: null });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          callback({ data: null, error: { message } });
        }
      }
    }),
    update: (updates: Record<string, unknown>) => ({
      eq: (column: string, value: string | number | boolean) => ({
        then: async (callback: SqliteCallback) => {
          await initDatabase();
          try {
            let count = 0;
            const equalsValue = value as IndexableType;
            if (tableName === 'users') count = await db.users.where(column).equals(equalsValue).modify(updates);
            else if (tableName === 'profiles') count = await db.profiles.where(column).equals(equalsValue).modify(updates);
            else if (tableName === 'study_sessions') count = await db.study_sessions.where(column).equals(equalsValue).modify(updates);
            else if (tableName === 'daily_tasks') count = await db.daily_tasks.where(column).equals(equalsValue).modify(updates);
            else if (tableName === 'reminders') count = await db.reminders.where(column).equals(equalsValue).modify(updates);

            callback({ data: { count }, error: null });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            callback({ data: null, error: { message } });
          }
        }
      })
    }),
    delete: () => ({
      eq: (column: string, value: string | number | boolean) => ({
        then: async (callback: SqliteCallback) => {
          await initDatabase();
          try {
            let count = 0;
            const equalsValue = value as IndexableType;
            if (tableName === 'users') count = await db.users.where(column).equals(equalsValue).delete();
            else if (tableName === 'profiles') count = await db.profiles.where(column).equals(equalsValue).delete();
            else if (tableName === 'study_sessions') count = await db.study_sessions.where(column).equals(equalsValue).delete();
            else if (tableName === 'daily_tasks') count = await db.daily_tasks.where(column).equals(equalsValue).delete();
            else if (tableName === 'reminders') count = await db.reminders.where(column).equals(equalsValue).delete();

            callback({ data: { count }, error: null });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            callback({ data: null, error: { message } });
          }
        }
      })
    })
  })
};