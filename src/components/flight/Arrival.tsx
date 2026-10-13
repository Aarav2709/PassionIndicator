import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useTimer } from '@/context/TimerContext';
import { formatDuration, formatTime } from '@/lib/types';
import { LonLat, formatDistance, getAirport, routePoints } from '@/lib/flights';
import { cn } from '@/lib/utils';
import WorldMap, { MapMarker } from '@/components/map/WorldMap';

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-neutral-500">{label}</div>
    <div className="mt-1 text-lg tabular-nums text-white">{value}</div>
  </div>
);

// the landing screen with what the flight covered
const Arrival = () => {
  const { arrival, dismissArrival, openBoarding, subjects, todos, toggleTodo, appSettings } = useTimer();
  const [taskDone, setTaskDone] = useState(false);

  useEffect(() => setTaskDone(false), [arrival]);

  if (!arrival) return null;

  const from = getAirport(arrival.from);
  const to = getAirport(arrival.to);
  const subject = subjects.find(s => s.id === arrival.subjectId);
  const task = todos.find(t => t.id === arrival.todoId);
  const returned = arrival.legs.length === 0 || arrival.to === arrival.from;

  const title = returned ? `Back in ${to.city}` : arrival.arrived ? `Welcome to ${to.city}` : `Landed in ${to.city}`;
  const subtitle = returned
    ? 'A short hop, so the plane taxied back to the gate.'
    : arrival.arrived
      ? arrival.mystery
        ? 'Your mystery flight landed right on time.'
        : 'Your flight landed right on time.'
      : arrival.kind === 'open'
        ? 'This is where your focus carried you.'
        : 'You landed early at the nearest airport.';

  const routes = arrival.legs.map(leg => ({ points: routePoints(getAirport(leg.from), getAirport(leg.to)), variant: 'flown' as const }));
  const stops = arrival.legs.map(leg => getAirport(leg.to));
  const markers: MapMarker[] = [
    ...(returned ? [] : [{ lon: from.lon, lat: from.lat, label: from.code, variant: 'origin' as const }]),
    ...stops.slice(0, -1).map(a => ({ lon: a.lon, lat: a.lat, label: a.code, variant: 'city' as const })),
    { lon: to.lon, lat: to.lat, label: to.code, variant: 'here' },
  ];
  const frame: LonLat[] = routes.length ? routes.flatMap(r => r.points) : [[to.lon, to.lat]];

  const markDone = async () => {
    if (!task || task.completed) return;
    await toggleTodo(task.id);
    setTaskDone(true);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black animate-fade-in" role="dialog" aria-modal="true" aria-label="Arrival">
      <WorldMap
        className="absolute inset-x-0 top-0 h-[52%] opacity-80 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
        frame={frame}
        minSpan={32}
        dotColor="#444444"
        routes={routes}
        markers={markers}
      />

      <div className="relative flex h-full flex-col items-center justify-end overflow-y-auto px-6 pb-12 pt-20">
        <p className="label animate-rise">{arrival.flightNo}</p>
        <h2 className="mt-2 text-center text-4xl font-medium animate-rise [animation-delay:80ms]">{title}</h2>
        <p className="mt-2 text-center text-sm text-neutral-400 animate-rise [animation-delay:140ms]">{subtitle}</p>

        <div className="mt-10 w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b] animate-rise [animation-delay:220ms]">
          <div className="flex items-end justify-between gap-4 p-6">
            <div>
              <div className="text-4xl font-medium leading-none">{from.code}</div>
              <div className="mt-1.5 text-xs text-neutral-500">{from.city}</div>
            </div>
            <div className="flex flex-1 items-center gap-2 pb-6">
              <span className="h-px flex-1 border-t border-dashed border-white/20" />
              {arrival.legs.length > 1 && <span className="text-xs text-neutral-500">{arrival.legs.length} legs</span>}
              <span className="h-px flex-1 border-t border-dashed border-white/20" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-medium leading-none">{to.code}</div>
              <div className="mt-1.5 text-xs text-neutral-500">{to.city}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/[0.07] p-6">
            <Stat label="Focus" value={formatDuration(arrival.focusSeconds)} />
            <Stat label="Distance" value={formatDistance(arrival.distanceKm, appSettings.distanceUnit)} />
            <Stat label="Max focus" value={formatTime(arrival.maxFocus)} />
          </div>

          {(subject || task) && (
            <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] px-6 py-4 text-sm">
              {subject && (
                <span className="flex min-w-0 items-center gap-2 text-neutral-300">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', subject.color)} />
                  <span className="truncate">
                    {subject.name}
                    {task && <span className="text-neutral-500">, {task.title}</span>}
                  </span>
                </span>
              )}
              {task && (
                <button
                  type="button"
                  onClick={markDone}
                  disabled={task.completed && !taskDone}
                  className={cn('btn-ghost shrink-0 py-1.5', (taskDone || task.completed) && 'border-emerald-400/40 text-emerald-300')}
                >
                  <Check size={14} />
                  {taskDone || task.completed ? 'Task done' : 'Mark task done'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-3 animate-rise [animation-delay:300ms]">
          {subject && (
            <button type="button" onClick={() => openBoarding(subject.id)} className="btn-ghost px-5 py-2.5">
              Fly again
            </button>
          )}
          <button type="button" onClick={dismissArrival} className="btn-primary px-6 py-2.5">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default Arrival;
