import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Shuffle, X } from 'lucide-react';
import { useTimer } from '@/context/TimerContext';
import { FlightKind, formatDuration } from '@/lib/types';
import { getBoardingPrefs, saveBoardingPrefs } from '@/lib/storage';
import { LonLat, distanceKm, formatDistance, getAirport, longHaulDestination, makeFlightNumber, randomDestination, routePoints, suggestDestinations } from '@/lib/flights';
import { cn } from '@/lib/utils';
import WorldMap, { MapMarker } from '@/components/map/WorldMap';
import Segmented from '@/components/ui/Segmented';

const MIN_SECONDS = 10 * 60;
const MAX_SECONDS = 16 * 3600;
const STEP = 5 * 60;

const KIND_OPTIONS: { value: FlightKind; label: string }[] = [
  { value: 'fixed', label: 'Direct' },
  { value: 'pomodoro', label: 'Pomodoro' },
  { value: 'open', label: 'Open flight' },
];

const clamp = (seconds: number) => Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, seconds));

// hours and minutes the user can type into or nudge with the buttons
const TimeInput = ({ value, onChange }: { value: number; onChange: (seconds: number) => void }) => {
  const [hours, setHours] = useState(String(Math.floor(value / 3600)));
  const [minutes, setMinutes] = useState(String(Math.floor((value % 3600) / 60)));

  useEffect(() => {
    setHours(String(Math.floor(value / 3600)));
    setMinutes(String(Math.floor((value % 3600) / 60)));
  }, [value]);

  const commit = (h: string, m: string) => {
    const total = (Number(h) || 0) * 3600 + (Number(m) || 0) * 60;
    onChange(clamp(total));
  };

  const field = 'w-14 bg-transparent text-center text-4xl tabular-nums text-white focus:outline-none focus-visible:ring-0';

  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => onChange(clamp(value - STEP))} aria-label="Five minutes less" className="icon-btn h-10 w-10 border border-white/10">
        <Minus size={16} />
      </button>
      <div className="flex items-baseline gap-1">
        <input
          inputMode="numeric"
          aria-label="Hours"
          value={hours}
          onChange={e => setHours(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => commit(hours, minutes)}
          className={field}
        />
        <span className="text-sm text-neutral-500">h</span>
        <input
          inputMode="numeric"
          aria-label="Minutes"
          value={minutes}
          onChange={e => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => commit(hours, minutes)}
          className={field}
        />
        <span className="text-sm text-neutral-500">m</span>
      </div>
      <button type="button" onClick={() => onChange(clamp(value + STEP))} aria-label="Five minutes more" className="icon-btn h-10 w-10 border border-white/10">
        <Plus size={16} />
      </button>
    </div>
  );
};

const Radio = ({ checked }: { checked: boolean }) => (
  <span className={cn('h-4 w-4 shrink-0 rounded-full border transition-all', checked ? 'border-[5px] border-accent' : 'border-white/20')} />
);

const BoardingSheet = () => {
  const { boardingSubjectId, closeBoarding, subjects, todos, location, startSession, pomodoroSettings, appSettings } = useTimer();
  const subject = subjects.find(s => s.id === boardingSubjectId);
  const origin = getAirport(location);
  const unit = appSettings.distanceUnit;

  const prefs = useMemo(getBoardingPrefs, []);
  const [kind, setKind] = useState<FlightKind>(prefs.kind);
  const [wanted, setWanted] = useState(clamp(prefs.plannedSeconds));
  const [choice, setChoice] = useState<string | 'surprise' | null>(null);
  const [pomodoroFirst, setPomodoroFirst] = useState(() => randomDestination(location, pomodoroSettings.focusDuration).code);
  const [openTarget] = useState(() => longHaulDestination(location).code);
  const [todoId, setTodoId] = useState<string | null>(null);
  const [flightNo] = useState(makeFlightNumber);

  const options = useMemo(() => suggestDestinations(location, wanted, 5), [location, wanted]);
  const [surprise, setSurprise] = useState(() => options[Math.floor(Math.random() * options.length)]);

  useEffect(() => {
    setChoice(current => (current === 'surprise' ? current : options[0]?.airport.code ?? null));
    setSurprise(options[Math.floor(Math.random() * options.length)]);
  }, [options]);

  if (!subject) return null;

  const openTasks = todos.filter(t => t.subjectId === subject.id && !t.completed);
  const picked = choice === 'surprise' ? surprise : options.find(o => o.airport.code === choice) ?? options[0];
  const target = kind === 'fixed' ? picked.airport : kind === 'pomodoro' ? getAirport(pomodoroFirst) : getAirport(openTarget);
  const showTarget = kind === 'pomodoro' || (kind === 'fixed' && choice !== 'surprise');

  const takeOff = () => {
    saveBoardingPrefs({ kind, plannedSeconds: wanted });
    startSession(subject.id, {
      kind,
      to: target.code,
      plannedSeconds: kind === 'fixed' ? picked.seconds : null,
      mystery: !showTarget,
      todoId,
      flightNo,
    });
  };

  const markers: MapMarker[] = [
    { lon: origin.lon, lat: origin.lat, label: origin.code, variant: 'here' },
    ...(kind === 'fixed' && choice !== 'surprise'
      ? options.filter(o => o.airport.code !== target.code).map(o => ({ lon: o.airport.lon, lat: o.airport.lat, label: o.airport.code, variant: 'city' as const }))
      : []),
    ...(showTarget ? [{ lon: target.lon, lat: target.lat, label: target.code, variant: 'dest' as const }] : []),
  ];
  const frame: LonLat[] = [
    [origin.lon, origin.lat],
    ...(showTarget ? routePoints(origin, target, 16) : []),
    ...(kind === 'fixed' && choice !== 'surprise' ? options.map(o => [o.airport.lon, o.airport.lat] as LonLat) : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-black animate-fade-in" role="dialog" aria-modal="true" aria-label={`Plan a flight for ${subject.name}`}>
      <div className="relative hidden flex-1 lg:block">
        <WorldMap
          className="absolute inset-0"
          frame={frame}
          minSpan={showTarget ? 36 : 80}
          dotColor="#484848"
          markers={markers}
          routes={showTarget ? [{ points: routePoints(origin, target), variant: 'preview' }] : []}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent" />
        <div className="absolute left-8 top-8">
          <p className="label">Departing from</p>
          <p className="mt-1 text-2xl">
            {origin.city} <span className="text-neutral-500">{origin.code}</span>
          </p>
        </div>
      </div>

      <div className="hairline flex w-full flex-col overflow-y-auto border-l lg:w-[520px]">
        <div className="flex items-center justify-between px-8 pb-2 pt-7">
          <span className="flex items-center gap-2.5 text-sm text-neutral-300">
            <span className={cn('h-2.5 w-2.5 rounded-full', subject.color)} />
            {subject.name}
          </span>
          <button type="button" onClick={closeBoarding} className="icon-btn -mr-2" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col px-8 pb-8">
          <h2 className="mt-4 text-2xl font-medium">Plan your flight</h2>
          <p className="mt-1 text-sm text-neutral-500 lg:hidden">
            Departing from {origin.city} ({origin.code}).
          </p>

          <Segmented className="mt-6 self-start" label="Flight type" value={kind} onChange={setKind} options={KIND_OPTIONS} />

          {kind === 'fixed' && (
            <>
              <p className="label mb-3 mt-8">How long do you want to fly?</p>
              <TimeInput value={wanted} onChange={setWanted} />

              <p className="label mb-2 mt-8">Destinations</p>
              <ul className="hairline divide-y divide-white/[0.07] border-y" role="radiogroup" aria-label="Destination">
                {options.map(option => {
                  const selected = choice === option.airport.code;
                  return (
                    <li key={option.airport.code}>
                      <button type="button" role="radio" aria-checked={selected} onClick={() => setChoice(option.airport.code)} className="flex w-full items-center gap-4 py-3 text-left">
                        <span className={cn('w-14 text-lg font-medium', selected ? 'text-white' : 'text-neutral-500')}>{option.airport.code}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block truncate text-sm', selected ? 'text-white' : 'text-neutral-400')}>{option.airport.city}</span>
                          <span className="block text-xs text-neutral-600">{formatDistance(option.km, unit)}</span>
                        </span>
                        <span className={cn('text-sm tabular-nums', selected ? 'text-white' : 'text-neutral-500')}>{formatDuration(option.seconds)}</span>
                        <Radio checked={selected} />
                      </button>
                    </li>
                  );
                })}
                <li>
                  <button type="button" role="radio" aria-checked={choice === 'surprise'} onClick={() => setChoice('surprise')} className="flex w-full items-center gap-4 py-3 text-left">
                    <span className={cn('w-14 text-lg font-medium', choice === 'surprise' ? 'text-white' : 'text-neutral-500')}>???</span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-sm', choice === 'surprise' ? 'text-white' : 'text-neutral-400')}>Surprise me</span>
                      <span className="block text-xs text-neutral-600">Revealed when you land.</span>
                    </span>
                    <span className={cn('text-sm tabular-nums', choice === 'surprise' ? 'text-white' : 'text-neutral-500')}>{formatDuration(surprise.seconds)}</span>
                    <Radio checked={choice === 'surprise'} />
                  </button>
                </li>
              </ul>
            </>
          )}

          {kind === 'pomodoro' && (
            <div className="mt-8">
              <p className="text-sm leading-relaxed text-neutral-400">
                Hop from city to city in {Math.round(pomodoroSettings.focusDuration / 60)} minute legs with {Math.round(pomodoroSettings.shortBreakDuration / 60)} minute layovers. Every{' '}
                {pomodoroSettings.longBreakInterval} legs you get a longer layover. Land whenever you are done.
              </p>
              <div className="hairline mt-6 flex items-center gap-4 border-y py-3">
                <span className="w-14 text-lg font-medium">{pomodoroFirst}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-white">First leg to {getAirport(pomodoroFirst).city}</span>
                  <span className="block text-xs text-neutral-600">{formatDistance(distanceKm(origin, getAirport(pomodoroFirst)), unit)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPomodoroFirst(randomDestination(location, pomodoroSettings.focusDuration).code)}
                  className="icon-btn"
                  aria-label="Pick another city"
                  title="Pick another city"
                >
                  <Shuffle size={15} />
                </button>
              </div>
            </div>
          )}

          {kind === 'open' && (
            <p className="mt-8 text-sm leading-relaxed text-neutral-400">
              Take off with no time limit and fly for as long as you can focus. When you land, you touch down at the airport nearest to where your focus took you.
            </p>
          )}

          {openTasks.length > 0 && (
            <>
              <p className="label mb-3 mt-8">Task for this flight</p>
              <div className="flex flex-wrap gap-2">
                {[{ id: null, title: 'None' }, ...openTasks].map(t => (
                  <button
                    key={t.id ?? 'none'}
                    type="button"
                    onClick={() => setTodoId(t.id)}
                    aria-pressed={todoId === t.id}
                    className={cn(
                      'max-w-full truncate rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                      todoId === t.id ? 'border-white bg-white text-black' : 'border-white/10 text-neutral-400 hover:border-white/25 hover:text-white'
                    )}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-auto pt-10">
            <button type="button" onClick={takeOff} className="btn w-full bg-accent py-3 text-black hover:brightness-110">
              Take off
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardingSheet;
