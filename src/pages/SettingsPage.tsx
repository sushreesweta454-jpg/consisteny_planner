import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SettingsPage = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studyReminders, setStudyReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [studyHoursGoal, setStudyHoursGoal] = useState("4");
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setName(data.full_name || "");
        setStudyReminders(data.study_reminders ?? true);
        setDailyDigest(data.daily_digest ?? true);
        setStreakAlerts(data.streak_alerts ?? true);
        setStudyHoursGoal(String(data.study_hours_goal ?? 4));
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        study_reminders: studyReminders,
        daily_digest: dailyDigest,
        streak_alerts: streakAlerts,
        study_hours_goal: parseInt(studyHoursGoal),
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved!", description: "Your preferences have been updated" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your preferences</p>
      </motion.div>

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


      <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground h-11 glow-primary">Save Changes</Button>
    </div>
  );
};

export default SettingsPage;
