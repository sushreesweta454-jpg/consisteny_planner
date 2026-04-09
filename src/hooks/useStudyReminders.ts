import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sqliteClient } from "@/integrations/sqlite/client";

const REMINDER_SENT_KEY = "study_reminders_sent";
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

interface ReminderState {
  date: string;
  goalSent: boolean;
  inactivitySent: boolean;
  planIncompleteSent: boolean;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getReminderState(): ReminderState {
  try {
    const raw = localStorage.getItem(REMINDER_SENT_KEY);
    if (raw) {
      const parsed: ReminderState = JSON.parse(raw);
      if (parsed.date === getTodayKey()) return parsed;
    }
  } catch {}
  return { date: getTodayKey(), goalSent: false, inactivitySent: false, planIncompleteSent: false };
}

function setReminderState(state: ReminderState) {
  localStorage.setItem(REMINDER_SENT_KEY, JSON.stringify(state));
}

function sendNotification(title: string, body: string) {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/placeholder.svg" });
  }
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

    // Check if reminders are enabled in profile
    sqliteClient.from("profiles").select("study_reminders, study_hours_goal").eq("user_id", user.id).single().then(({ data: profile }) => {
      if (!profile || profile.study_reminders === false) return;

      const goalHours = profile.study_hours_goal ?? 4;
      const goalSeconds = goalHours * 3600;
      const today = getTodayKey();

      // Fetch today's sessions
      sqliteClient.from("study_sessions").select("duration").eq("user_id", user.id).then(({ data: sessions }) => {
        const todaySessions = (sessions || []).filter(s => s.created_at.startsWith(today));
        const state = getReminderState();
        const totalSeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);
        const sessionCount = todaySessions.length;

        // Inactivity check — no sessions at all today
        if (sessionCount === 0 && !state.inactivitySent) {
          sendNotification(
            "No study activity today 😴",
            "You didn't study today! Start now and stay on track!"
          );
          state.inactivitySent = true;
          setReminderState(state);
          return; // Don't stack notifications
        }

        // Goal check — studied but not enough
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

        // Planner check — incomplete daily tasks
        if (!state.planIncompleteSent) {
          sqliteClient.from("daily_tasks").select("id, completed").eq("user_id", user.id).then(({ data: tasks }) => {
            const todayTasks = (tasks || []).filter(t => t.date === today);
            const incomplete = todayTasks.filter(t => !t.completed);
            if (todayTasks.length > 0 && incomplete.length > 0) {
              sendNotification(
                "Study plan incomplete 📝",
                `You have ${incomplete.length} of ${todayTasks.length} tasks still pending in today's planner. Keep going!`
              );
              state.planIncompleteSent = true;
              setReminderState(state);
            }
          });
        }
      });
    });
  }, [user]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!user) return;

    // Initial check after 2 minutes (give user time to start)
    const timeout = setTimeout(() => {
      checkAndNotify();
      // Then check every 10 minutes
      intervalRef.current = setInterval(checkAndNotify, CHECK_INTERVAL);
    }, 2 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, checkAndNotify]);
}
