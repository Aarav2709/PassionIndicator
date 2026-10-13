import { useEffect, useMemo, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SubjectRow from '@/components/Home/SubjectRow';
import WorldMap, { MapMarker, MapRoute } from '@/components/map/WorldMap';
import { useTimer } from '@/context/TimerContext';
import { SUBJECT_COLORS, Session, formatClock, formatDuration, formatTime, getDateKey, parseKey } from '@/lib/types';
import { getSessions } from '@/lib/storage';
import { LonLat, formatDistance, getAirport, routePoints } from '@/lib/flights';
import { cn } from '@/lib/utils';

const pickColor = (used: string[]) => {
  const unused = SUBJECT_COLORS.filter(c => !used.includes(c.value));
  const pool = unused.length > 0 ? unused : SUBJECT_COLORS;
  return pool[Math.floor(Math.random() * pool.length)].value;
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="label">{label}</dt>
    <dd className="mt-1.5 text-base tabular-nums text-white">{value}</dd>
  </div>
);

const Home = () => {
  const {
    subjects,
    todayTotalFocus,
    todayMaxFocus,
    todayStartedAt,
    todayDistanceKm,
    todayKey,
    dataVersion,
    location,
    appSettings,
    addSubject,
    moveSubjects,
  } = useTimer();

  const [adding, setAdding] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);

  useEffect(() => {
    getSessions().then(all => setTodaySessions(all.filter(s => s.flight && getDateKey(s.startedAt) === todayKey)));
  }, [dataVersion, todayKey]);

  const here = getAirport(location);

  // today's routes stay on the map, the view keeps the parked plane in the middle
  const { routes, frame, markers } = useMemo(() => {
    const legs = todaySessions.flatMap(s => s.flight!.legs);
    const routes: MapRoute[] = legs.map(leg => ({ points: routePoints(getAirport(leg.from), getAirport(leg.to)), variant: 'history' }));
    const stops = [...new Set(legs.flatMap(leg => [leg.from, leg.to]))].filter(code => code !== here.code).map(getAirport);
    const frame: LonLat[] = [[here.lon, here.lat], ...stops.map(a => [a.lon, a.lat] as LonLat)];
    const markers: MapMarker[] = [
      ...stops.map(a => ({ lon: a.lon, lat: a.lat, label: a.code, variant: 'city' as const })),
      { lon: here.lon, lat: here.lat, label: here.code, variant: 'here' },
    ];
    return { routes, frame, markers };
  }, [todaySessions, here]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const goal = appSettings.dailyGoalSeconds;
  const progress = goal > 0 ? todayTotalFocus / goal : 0;
  const goalReached = progress >= 1;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubject.trim();
    if (!name) return;
    addSubject(name, pickColor(subjects.map(s => s.color)));
    setNewSubject('');
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = subjects.findIndex(s => s.id === active.id);
    const newIndex = subjects.findIndex(s => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) moveSubjects(oldIndex, newIndex);
  };

  const dateLabel = parseKey(todayKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex min-h-full flex-col lg:h-full lg:flex-row">
      <section className="relative flex min-h-[560px] flex-1 flex-col justify-between overflow-hidden lg:min-h-0">
        <WorldMap className="absolute inset-0" frame={frame} minSpan={80} dotColor="#3a3a3a" routes={routes} markers={markers} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black via-black/85 to-transparent" />

        <header className="relative flex items-start justify-between gap-4 px-8 pt-8">
          <div>
            <p className="text-sm text-neutral-400">{dateLabel}</p>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3.5 py-1.5 text-xs text-neutral-300 backdrop-blur">
            <MapPin size={12} className="text-accent" />
            Parked at {here.city} <span className="text-neutral-500">{here.code}</span>
          </span>
        </header>

        <div className="relative px-8 pb-10">
          <p className="label">Today</p>
          <h1 className="mt-2 text-[clamp(4rem,8.5vw,8rem)] font-normal leading-none tracking-tight tabular-nums" aria-label={`Studied today ${formatTime(todayTotalFocus)}`}>
            {formatTime(todayTotalFocus)}
          </h1>

          {goal > 0 && (
            <a href="#/settings" className="group mt-7 block max-w-sm" title="Change daily goal">
              <div
                className="h-[3px] overflow-hidden rounded-full bg-white/[0.1]"
                role="progressbar"
                aria-label="Daily goal"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, Math.round(progress * 100))}
              >
                <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', goalReached ? 'bg-emerald-400' : 'bg-accent')} style={{ width: `${Math.min(1, progress) * 100}%` }} />
              </div>
              <div className="mt-2.5 flex justify-between text-xs text-neutral-500 transition-colors group-hover:text-neutral-400">
                <span>{goalReached ? 'Daily goal reached' : `Goal ${formatDuration(goal)}`}</span>
                <span className="tabular-nums">{Math.round(progress * 100)}%</span>
              </div>
            </a>
          )}

          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4">
            <Stat label="Max focus" value={formatTime(todayMaxFocus)} />
            <Stat label="Started" value={todayStartedAt ? formatClock(todayStartedAt) : '--:--'} />
            <Stat label="Flown today" value={formatDistance(todayDistanceKm, appSettings.distanceUnit)} />
          </dl>
        </div>
      </section>

      <aside className="hairline flex flex-col border-t pb-20 md:pb-0 lg:w-[440px] lg:border-l lg:border-t-0 xl:w-[480px]">
        <div className="px-6 pb-3 pt-8">
          <h2 className="text-lg font-medium">Departures</h2>
          <p className="mt-1 text-xs text-neutral-500">Pick a subject to board a focus flight from {here.city}.</p>
        </div>

        <div className="flex-1 px-3 lg:overflow-y-auto">
          {subjects.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={subjects.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <ul>
                  {subjects.map(subject => (
                    <SubjectRow key={subject.id} subject={subject} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="px-3 py-6 text-sm text-neutral-500">Add your first subject to start flying.</p>
          )}

          <div className="px-1 py-3">
            {adding ? (
              <form onSubmit={handleCreate} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  onBlur={() => !newSubject.trim() && setAdding(false)}
                  onKeyDown={e => e.key === 'Escape' && (setNewSubject(''), setAdding(false))}
                  maxLength={40}
                  placeholder="Subject name"
                  aria-label="New subject name"
                  className="field rounded-full px-4"
                />
                <button type="submit" disabled={!newSubject.trim()} className="btn-primary shrink-0">
                  Add
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-sm text-neutral-500 transition-colors hover:text-white"
              >
                <span className="ml-6 flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-white/15">
                  <Plus size={15} />
                </span>
                Add subject
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Home;
