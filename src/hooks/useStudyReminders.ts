import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sqliteClient } from "@/integrations/sqlite/client";

const REMINDER_SENT_KEY = "study_reminders_sent";
const CHECK_INTERVAL = 60 * 1000; // 1 minute

interface ReminderState {
  date: string;
  goalSent: boolean;
  inactivitySent: boolean;
  planIncompleteSent: boolean;
  sentCustomReminders: string[];
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getReminderState(): ReminderState {
  try {
    const raw = localStorage.getItem(REMINDER_SENT_KEY);
    if (raw) {
      const parsed: ReminderState = JSON.parse(raw);
      if (parsed.date === getTodayKey()) return {
        date: parsed.date,
        goalSent: parsed.goalSent ?? false,
        inactivitySent: parsed.inactivitySent ?? false,
        planIncompleteSent: parsed.planIncompleteSent ?? false,
        sentCustomReminders: parsed.sentCustomReminders ?? []
      };
    }
  } catch (error) {
    console.warn("Failed to parse reminder state", error);
  }
  return {
    date: getTodayKey(),
    goalSent: false,
    inactivitySent: false,
    planIncompleteSent: false,
    sentCustomReminders: []
  };
}

function setReminderState(state: ReminderState) {
  localStorage.setItem(REMINDER_SENT_KEY, JSON.stringify(state));
}

function parseReminderTime(time: string): number {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function sendNotification(title: string, body: string) {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/placeholder.svg" });
  }
}

function queryReminders(userId: string) {
  return new Promise<any[]>((resolve) => {
    sqliteClient.from("reminders").select("*").eq("user_id", userId).then(({ data }) => {
      resolve((data as any[]) || []);
    });
  });
}

function queryProfile(userId: string) {
  return new Promise<any>((resolve) => {
    sqliteClient.from("profiles").select("study_reminders, study_hours_goal").eq("user_id", userId).single().then(({ data }) => {
      resolve(data);
    });
  });
}

function queryStudySessions(userId: string) {
  return new Promise<any[]>((resolve) => {
    sqliteClient.from("study_sessions").select("duration, created_at").eq("user_id", userId).then(({ data }) => {
      resolve((data as any[]) || []);
    });
  });
}

function queryDailyTasks(userId: string) {
  return new Promise<any[]>((resolve) => {
    sqliteClient.from("daily_tasks").select("id, completed, date").eq("user_id", userId).then(({ data }) => {
      resolve((data as any[]) || []);
    });
  });
}

export function useStudyReminders() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  const checkAndNotify = useCallback(async () => {
    if (!user) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const profile = await queryProfile(user.id);
    if (!profile || profile.study_reminders === false) return;

    const state = getReminderState();
    const now = Date.now();
    const today = getTodayKey();

    const reminders = await queryReminders(user.id);
    const pendingReminders = (reminders || [])
      .filter((reminder) => reminder.enabled)
      .filter((reminder) => !state.sentCustomReminders.includes(reminder.id));

    for (const reminder of pendingReminders) {
      const scheduledMs = parseReminderTime(reminder.time);
      if (scheduledMs <= now) {
        sendNotification(reminder.title, `Reminder set for ${reminder.time}`);
        state.sentCustomReminders.push(reminder.id);
      }
    }

    if (state.sentCustomReminders.length > 0) {
      setReminderState(state);
    }

    const goalHours = profile.study_hours_goal ?? 4;
    const goalSeconds = goalHours * 3600;

    const sessions = await queryStudySessions(user.id);
    const todaySessions = (sessions || []).filter((s) => s.created_at.startsWith(today));
    const totalSeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionCount = todaySessions.length;

    if (sessionCount === 0 && !state.inactivitySent) {
      sendNotification(
        "No study activity today 😴",
        "You didn't study today! Start now and stay on track!"
      );
      state.inactivitySent = true;
      setReminderState(state);
      return;
    }

    if (sessionCount > 0 && totalSeconds < goalSeconds && !state.goalSent) {
      const remaining = Math.ceil((goalSeconds - totalSeconds) / 60);
      sendNotification(
        "Study goal incomplete 📚",
        `You still need ${remaining} more minutes to reach your ${goalHours}h goal. Stay consistent!`
      );
      state.goalSent = true;
      setReminderState(state);
      return;
    }

    if (!state.planIncompleteSent) {
      const tasks = await queryDailyTasks(user.id);
      const todayTasks = (tasks || []).filter((t) => t.date === today);
      const incomplete = todayTasks.filter((t) => !t.completed);
      if (todayTasks.length > 0 && incomplete.length > 0) {
        sendNotification(
          "Study plan incomplete 📝",
          `You have ${incomplete.length} of ${todayTasks.length} tasks still pending in today's planner. Keep going!`
        );
        state.planIncompleteSent = true;
        setReminderState(state);
      }
    }
  }, [user]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!user) return;

    checkAndNotify();
    intervalRef.current = setInterval(checkAndNotify, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, checkAndNotify]);
}
