import { useEffect, useMemo } from 'react';
import { Pause, Play, PlaneLanding, Volume2, VolumeX } from 'lucide-react';
import { useTimer } from '@/context/TimerContext';
import { formatClock, formatTime } from '@/lib/types';
import { LonLat, distanceKm, formatDistance, formatSpeed, getAirport, interpolate, project, routePoints } from '@/lib/flights';
import { cn } from '@/lib/utils';
import WorldMap, { MapMarker, MapRoute } from '@/components/map/WorldMap';

const DEFAULT_TITLE = document.title;

function unwrapNear(lon: number, ref: number): number {
  while (lon - ref > 180) lon -= 360;
  while (lon - ref < -180) lon += 360;
  return lon;
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-neutral-500">{label}</div>
    <div className="mt-1 text-base tabular-nums text-white">{value}</div>
  </div>
);

const PHASE_LABELS = { ground: 'On the ground', taxi: 'Taxiing', climb: 'Climbing', cruise: 'Cruising', descent: 'Descending' } as const;

const InFlight = () => {
  const { timerState, displayTimes, activeSubject, todos, todayTotalFocus, appSettings, muted, toggleMuted, stopSession, pauseSession, resumeSession } = useTimer();
  const flight = timerState.flight;
  const active = timerState.mode !== 'idle' && !!flight && !!activeSubject;
  const isFlying = timerState.mode === 'focusing';
  const onLayover = timerState.pomodoroPhase === 'shortBreak' || timerState.pomodoroPhase === 'longBreak';
  const hidden = flight?.kind === 'open' || !!flight?.mystery;
  const { distanceUnit, speedUnit } = appSettings;

  const from = flight ? getAirport(flight.from) : null;
  const to = flight ? getAirport(flight.to) : null;
  const progress = displayTimes.progress;

  const geometry = useMemo(() => {
    if (!from || !to) return null;
    const full = routePoints(from, to, 96);
    const steps = Math.max(1, Math.round(progress * 96));
    const flown = progress > 0 ? full.slice(0, steps + 1) : [];
    const pos = interpolate(from, to, progress);
    const ahead = interpolate(from, to, Math.min(1, progress + 0.01));
    const lon = unwrapNear(pos.lon, from.lon);
    const [x1, y1] = project([lon, pos.lat]);
    const [x2, y2] = project([unwrapNear(ahead.lon, lon), ahead.lat]);
    const heading = progress >= 1 ? 0 : (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return { full, flown, plane: { lon, lat: pos.lat, heading } };
  }, [from, to, progress]);

  useEffect(() => {
    document.documentElement.style.overflowY = active ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflowY = '';
    };
  }, [active]);

  const shown = !isFlying && !onLayover ? displayTimes.currentBreak : displayTimes.remaining ?? displayTimes.legFocus;

  useEffect(() => {
    document.title = active ? `${formatTime(shown)} ${isFlying ? 'in flight' : onLayover ? 'on layover' : 'holding'}` : DEFAULT_TITLE;
  }, [active, shown, isFlying, onLayover]);

  useEffect(() => () => void (document.title = DEFAULT_TITLE), []);

  if (!active || !flight || !from || !to || !geometry) return null;

  const routeKm = distanceKm(from, to);
  const flownKm = flight.legs.reduce((acc, leg) => acc + leg.distanceKm, 0) + (onLayover ? 0 : routeKm * progress);
  const task = todos.find(t => t.id === flight.todoId);
  const holding = !isFlying && !onLayover;

  const phase = onLayover
    ? `${timerState.pomodoroPhase === 'longBreak' ? 'Long layover' : 'Layover'} in ${to.city}`
    : holding
      ? 'Holding pattern'
      : PHASE_LABELS[displayTimes.phase];
  const status = flight.kind === 'pomodoro' && !onLayover ? `Leg ${flight.legs.length + 1}, ${phase.toLowerCase()}` : phase;

  const routes: MapRoute[] = [
    ...flight.legs.map(leg => ({ points: routePoints(getAirport(leg.from), getAirport(leg.to)), variant: 'history' as const })),
    ...(hidden || onLayover ? [] : [{ points: geometry.full, variant: 'planned' as const }]),
    ...(onLayover ? [] : [{ points: geometry.flown, variant: 'flown' as const }]),
  ];
  const origin = getAirport(flight.legs[0]?.from ?? flight.from);
  const markers: MapMarker[] = [
    // the label hides while the plane still sits on top of it
    { lon: origin.lon, lat: origin.lat, label: flight.legs.length === 0 && progress < 0.08 ? undefined : origin.code, variant: 'origin' },
    ...flight.legs.map(leg => ({ lon: getAirport(leg.to).lon, lat: getAirport(leg.to).lat, label: leg.to, variant: 'city' as const })),
    ...(hidden || onLayover ? [] : [{ lon: to.lon, lat: to.lat, label: to.code, variant: 'dest' as const }]),
  ];
  const frame: LonLat[] = hidden
    ? [[from.lon, from.lat], [geometry.plane.lon, geometry.plane.lat]]
    : [...geometry.full, ...flight.legs.map(leg => [getAirport(leg.from).lon, getAirport(leg.from).lat] as LonLat)];

  const arrivesAt = displayTimes.remaining !== null && !onLayover ? formatClock(Date.now() + displayTimes.remaining * 1000) : null;

  const note = onLayover
    ? 'The next leg boards automatically.'
    : holding
      ? 'Paused.'
      : arrivesAt
        ? hidden
          ? `Arriving at ${arrivesAt}.`
          : `Arriving in ${to.city} at ${arrivesAt}.`
        : 'Land whenever you are ready.';

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white animate-fade-in" role="dialog" aria-modal="true" aria-label="Focus flight">
      <WorldMap
        className="absolute inset-x-0 top-0 h-[74%] [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
        frame={frame}
        minSpan={hidden ? 40 : 32}
        dotColor="#4a4a4a"
        routes={routes}
        markers={markers}
        plane={onLayover ? undefined : geometry.plane}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/70 to-transparent" />

      <header className="absolute inset-x-0 top-0 flex items-start justify-between gap-6 px-8 py-7">
        <div>
          <p className="label">{flight.flightNo}</p>
          <p className="mt-1 text-2xl font-medium">
            {flight.legs[0]?.from ?? from.code} <span className="text-neutral-600">to</span> {hidden ? '???' : to.code}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-neutral-400">
            <span className={cn('h-2 w-2 rounded-full', activeSubject.color)} />
            {activeSubject.name}
            {task && <span className="text-neutral-600">{task.title}</span>}
          </p>
        </div>
        <div className="flex items-start gap-6">
          <div className="text-right">
            <p className="label">Today</p>
            <p className="mt-1 text-lg tabular-nums">{formatTime(todayTotalFocus)}</p>
          </div>
          {appSettings.ambience !== 'off' && (
            <button type="button" onClick={toggleMuted} className="icon-btn mt-1" aria-label={muted ? 'Turn ambience on' : 'Mute ambience'} title={muted ? 'Ambience off' : 'Ambience on'}>
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          )}
        </div>
      </header>

      <div className="absolute inset-x-0 bottom-0 px-8 pb-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={cn('text-sm', holding ? 'text-rose-400' : 'text-neutral-400')}>{status}</p>
            <div className={cn('mt-2 text-[clamp(4rem,11vw,9rem)] font-normal leading-none tabular-nums transition-colors duration-500', holding ? 'text-rose-400' : 'text-white')}>
              {formatTime(shown)}
            </div>
            <p className="mt-3 text-sm text-neutral-500">{note}</p>
          </div>

          <div className="flex flex-col gap-6 lg:items-end">
            <div className="grid grid-cols-2 gap-x-10 gap-y-5 sm:grid-cols-4 lg:text-right">
              <Stat label="Speed" value={formatSpeed(onLayover ? 0 : displayTimes.speedKmh, speedUnit)} />
              <Stat label="Altitude" value={`${displayTimes.altitudeFt.toLocaleString()} ft`} />
              <Stat label="Flown" value={formatDistance(flownKm, distanceUnit)} />
              <Stat label="To go" value={hidden || onLayover ? 'Unknown' : formatDistance(routeKm * (1 - progress), distanceUnit)} />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={isFlying ? pauseSession : resumeSession}
                className="btn border border-white/15 px-5 py-3 text-white hover:border-white/40 hover:bg-white/[0.04]"
              >
                {isFlying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                {isFlying ? 'Hold' : onLayover ? 'Skip layover' : 'Resume'}
              </button>
              <button type="button" onClick={stopSession} className="btn bg-white px-5 py-3 text-black hover:bg-neutral-200">
                <PlaneLanding size={16} />
                Land now
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 h-[2px] max-w-6xl overflow-hidden rounded-full bg-white/[0.08]">
          <div className={cn('h-full transition-[width] duration-1000 ease-linear', holding ? 'bg-rose-400' : 'bg-accent')} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
};

export default InFlight;
