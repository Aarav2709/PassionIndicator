import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useTimer } from '@/context/TimerContext';
import { exportBackup, importBackup } from '@/lib/backup';
import { eraseAllData } from '@/lib/storage';
import { AIRPORTS, getAirport } from '@/lib/flights';
import { AmbienceKind, DistanceUnit, SpeedUnit } from '@/lib/types';
import Switch from '@/components/ui/Switch';
import Segmented from '@/components/ui/Segmented';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-12 first:mt-10">
    <h2 className="label mb-2">{title}</h2>
    <div className="hairline divide-y divide-white/[0.07] border-y">{children}</div>
  </section>
);

const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-6 py-4">
    <div className="min-w-0">
      <div className="text-sm text-white">{label}</div>
      {hint && <div className="mt-0.5 text-xs leading-relaxed text-neutral-500">{hint}</div>}
    </div>
    <div className="flex shrink-0 items-center gap-2">{children}</div>
  </div>
);

// keeps typing free and only clamps and saves when the field is left
const NumberInput = ({ value, min, max, suffix, label, onCommit }: { value: number; min: number; max: number; suffix: string; label: string; onCommit: (v: number) => void }) => {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const n = Math.round(Number(draft));
    if (draft.trim() && Number.isFinite(n)) onCommit(Math.min(max, Math.max(min, n)));
    setDraft(null);
  };

  return (
    <label className="flex items-center gap-2 text-xs text-neutral-500">
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        aria-label={label}
        value={draft ?? value}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        className="field w-16 text-right tabular-nums"
      />
      {suffix}
    </label>
  );
};

const DISTANCE_OPTIONS: { value: DistanceUnit; label: string }[] = [
  { value: 'km', label: 'km' },
  { value: 'mi', label: 'mi' },
  { value: 'nm', label: 'nm' },
];

const SPEED_OPTIONS: { value: SpeedUnit; label: string }[] = [
  { value: 'kmh', label: 'km/h' },
  { value: 'mph', label: 'mph' },
  { value: 'kts', label: 'kts' },
];

const AMBIENCE_OPTIONS: { value: AmbienceKind; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'rain', label: 'Rain' },
];

const Settings = () => {
  const { pomodoroSettings, updatePomodoroSettings, appSettings, updateAppSettings, reloadAll, location, setLocation, timerState } = useTimer();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const notificationsBlocked = 'Notification' in window && Notification.permission === 'denied';

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled && 'Notification' in window && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    updateAppSettings({ notifications: enabled });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const result = await importBackup(file);
      await reloadAll();
      setNotice(`Imported ${result.subjects} subjects and ${result.sessions} sessions.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The import failed.');
    }
  };

  const handleErase = async () => {
    if (!window.confirm('Erase every subject, task, flight and setting stored in this browser? This cannot be undone.')) return;
    await eraseAllData();
    window.location.reload();
  };

  const minutes = (seconds: number) => Math.round(seconds / 60);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 pb-24 pt-8 md:pb-12">
      <h1 className="text-xl font-medium">Settings</h1>

      <Section title="Flying">
        <Row label="Home airport" hint={`Your plane is parked at ${getAirport(location).city} (${location}).`}>
          <select value={appSettings.homeAirport} onChange={e => updateAppSettings({ homeAirport: e.target.value })} aria-label="Home airport" className="field w-56">
            {[...AIRPORTS]
              .sort((a, b) => a.city.localeCompare(b.city))
              .map(a => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code})
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={() => setLocation(appSettings.homeAirport)}
            disabled={location === appSettings.homeAirport || timerState.mode !== 'idle'}
            className="btn-ghost"
          >
            Fly home
          </button>
        </Row>
        <Row label="Distance">
          <Segmented label="Distance unit" value={appSettings.distanceUnit} onChange={distanceUnit => updateAppSettings({ distanceUnit })} options={DISTANCE_OPTIONS} />
        </Row>
        <Row label="Speed">
          <Segmented label="Speed unit" value={appSettings.speedUnit} onChange={speedUnit => updateAppSettings({ speedUnit })} options={SPEED_OPTIONS} />
        </Row>
      </Section>

      <Section title="Pomodoro">
        <Row label="Leg length" hint="Focus time for each pomodoro leg.">
          <NumberInput label="Leg minutes" value={minutes(pomodoroSettings.focusDuration)} min={1} max={180} suffix="min" onCommit={v => updatePomodoroSettings({ focusDuration: v * 60 })} />
        </Row>
        <Row label="Short layover">
          <NumberInput label="Short layover minutes" value={minutes(pomodoroSettings.shortBreakDuration)} min={1} max={60} suffix="min" onCommit={v => updatePomodoroSettings({ shortBreakDuration: v * 60 })} />
        </Row>
        <Row label="Long layover">
          <NumberInput label="Long layover minutes" value={minutes(pomodoroSettings.longBreakDuration)} min={1} max={120} suffix="min" onCommit={v => updatePomodoroSettings({ longBreakDuration: v * 60 })} />
        </Row>
        <Row label="Long layover every" hint="Number of legs before a long layover.">
          <NumberInput label="Legs before a long layover" value={pomodoroSettings.longBreakInterval} min={1} max={12} suffix="legs" onCommit={v => updatePomodoroSettings({ longBreakInterval: v })} />
        </Row>
      </Section>

      <Section title="Goals">
        <Row label="Daily goal" hint="Fills the bar on the Fly page and the calendar in Stats.">
          <NumberInput
            label="Goal hours"
            value={Math.floor(appSettings.dailyGoalSeconds / 3600)}
            min={0}
            max={23}
            suffix="h"
            onCommit={v => updateAppSettings({ dailyGoalSeconds: v * 3600 + (appSettings.dailyGoalSeconds % 3600) })}
          />
          <NumberInput
            label="Goal minutes"
            value={Math.floor((appSettings.dailyGoalSeconds % 3600) / 60)}
            min={0}
            max={59}
            suffix="m"
            onCommit={v => updateAppSettings({ dailyGoalSeconds: Math.floor(appSettings.dailyGoalSeconds / 3600) * 3600 + v * 60 })}
          />
        </Row>
        <Row label="Day starts at" hint="Study before this hour counts toward the previous day.">
          <select value={appSettings.dayStartHour} onChange={e => updateAppSettings({ dayStartHour: Number(e.target.value) })} aria-label="Day start hour" className="field w-24 tabular-nums">
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title="Sound">
        <Row label="Ambience" hint="A soft background sound while you fly.">
          <Segmented label="Ambience" value={appSettings.ambience} onChange={ambience => updateAppSettings({ ambience })} options={AMBIENCE_OPTIONS} />
        </Row>
        {appSettings.ambience !== 'off' && (
          <Row label="Ambience volume">
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={appSettings.ambienceVolume}
              onChange={e => updateAppSettings({ ambienceVolume: Number(e.target.value) })}
              aria-label="Ambience volume"
              className="w-40 accent-white"
            />
          </Row>
        )}
        <Row label="Chime" hint="Plays when you land or a pomodoro leg ends.">
          <Switch label="Chime" checked={appSettings.sound} onChange={sound => updateAppSettings({ sound })} />
        </Row>
        <Row label="Desktop notifications" hint={notificationsBlocked ? 'Blocked by the browser. Allow them in the site settings first.' : 'Get notified when you land, even in another window.'}>
          <Switch label="Desktop notifications" checked={appSettings.notifications && !notificationsBlocked} onChange={toggleNotifications} />
        </Row>
      </Section>

      <Section title="Data">
        <Row label="Backup" hint="Your data only lives in this browser. Export a file now and then so it is never lost.">
          <button type="button" onClick={() => exportBackup()} className="btn-ghost">
            <Download size={14} />
            Export
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost">
            <Upload size={14} />
            Import
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
        </Row>
        {notice && (
          <p className="py-3 text-xs text-neutral-400" role="status">
            {notice}
          </p>
        )}
        <Row label="Erase all data" hint="Removes everything stored in this browser and starts fresh.">
          <button type="button" onClick={handleErase} className="btn-ghost border-rose-500/30 text-rose-400 hover:border-rose-500/60 hover:text-rose-300">
            Erase
          </button>
        </Row>
      </Section>
    </div>
  );
};

export default Settings;
