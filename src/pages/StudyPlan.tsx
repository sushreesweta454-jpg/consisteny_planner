import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const initialTasks = [
  { id: "1", subject: "Mathematics", topic: "Linear Algebra", time: "9:00 - 10:30" },
  { id: "2", subject: "Mathematics", topic: "Calculus", time: "11:00 - 12:00" },
  { id: "3", subject: "Physics", topic: "Mechanics", time: "10:30 - 11:30" },
  { id: "4", subject: "Physics", topic: "Thermodynamics", time: "13:00 - 14:00" },
  { id: "5", subject: "Chemistry", topic: "Organic Chemistry", time: "15:30 - 16:30" },
  { id: "6", subject: "Chemistry", topic: "Periodic Table Review", time: "17:00 - 17:30" },
  { id: "7", subject: "English", topic: "Essay Writing", time: "18:00 - 19:00" },
  { id: "8", subject: "Statistics", topic: "Probability", time: "14:00 - 15:00" },
];

const StudyPlan = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const allDone = initialTasks.every((t) => checked[t.id]);
  const doneCount = initialTasks.filter((t) => checked[t.id]).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" /> Daily Planner
        </h1>
        <p className="text-muted-foreground mt-1">
          {doneCount}/{initialTasks.length} tasks completed
        </p>
      </motion.div>

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card p-6 text-center border-2 border-success/30 bg-success/5"
          >
            <p className="text-2xl font-bold font-display text-success">
              Your task completed ✅
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Great job! You finished everything for today.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {initialTasks.map((task, i) => {
          const done = !!checked[task.id];
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggle(task.id)}
              className={`glass-card p-4 flex items-center gap-4 cursor-pointer transition-all ${
                done
                  ? "bg-success/5 border-success/20"
                  : "hover:border-primary/30"
              }`}
            >
              <Checkbox
                checked={done}
                onCheckedChange={() => toggle(task.id)}
                className="h-5 w-5"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm ${
                    done ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.topic}
                </p>
                <p className="text-xs text-muted-foreground">{task.subject}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3 w-3" />
                {task.time}
              </div>
              {done && (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyPlan;
