import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface StudyPlanSession {
  startTime: number;
  endTime: number;
  completed: boolean;
  [key: string]: unknown;
}

export function markSessionCompleted<T extends StudyPlanSession>(
  studyPlan: T[],
  recordingStarted: boolean,
  currentTime: number,
) {
  if (!recordingStarted) {
    return studyPlan;
  }

  const bufferMs = 10 * 60 * 1000;
  let matched = false;

  const updatedPlan = studyPlan.map((session) => {
    if (
      !matched &&
      currentTime >= session.startTime - bufferMs &&
      currentTime <= session.endTime + bufferMs
    ) {
      matched = true;
      return {
        ...session,
        completed: true,
      };
    }
    return session;
  });

  return matched ? updatedPlan : studyPlan;
}
