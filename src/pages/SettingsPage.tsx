import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const user = JSON.parse(localStorage.getItem("consistify_current") || '{"name":"Student","email":"student@example.com"}');
  const [name, setName] = useState(user.name || "");
  const [email] = useState(user.email || "");
  const [studyReminders, setStudyReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [studyHoursGoal, setStudyHoursGoal] = useState("4");
  const { toast } = useToast();

  const handleSave = () => {
    const current = JSON.parse(localStorage.getItem("consistify_current") || "{}");
    current.name = name;
    localStorage.setItem("consistify_current", JSON.stringify(current));
    toast({ title: "Settings saved!", description: "Your preferences have been updated" });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your preferences</p>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/80">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border h-10" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/80">Email</Label>
            <Input value={email} disabled className="bg-secondary border-border h-10 opacity-60" />
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notifications</h2>
        <div className="space-y-4">
          {[
            { label: "Study Reminders", value: studyReminders, onChange: setStudyReminders },
            { label: "Daily Digest", value: dailyDigest, onChange: setDailyDigest },
            { label: "Streak Alerts", value: streakAlerts, onChange: setStreakAlerts },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm">{item.label}</span>
              <Switch checked={item.value} onCheckedChange={item.onChange} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Daily Study Hours Goal</span>
            <Select value={studyHoursGoal} onValueChange={setStudyHoursGoal}>
              <SelectTrigger className="bg-secondary border-border w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <SelectItem key={h} value={String(h)}>{h} hours</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground h-11 glow-primary">Save Changes</Button>
    </div>
  );
};

export default SettingsPage;
