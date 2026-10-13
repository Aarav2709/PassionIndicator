import { useEffect, useMemo, useState } from 'react';
import { useTimer } from '@/context/TimerContext';
import { Session, formatDuration } from '@/lib/types';
import { getSessions } from '@/lib/storage';
import { LonLat, formatDistance, getAirport, routePoints } from '@/lib/flights';
import { cn } from '@/lib/utils';
import WorldMap, { MapMarker, MapRoute } from '@/components/map/WorldMap';

const PAGE_SIZE = 30;

const Logbook = () => {
  const { subjects, dataVersion, appSettings } = useTimer();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    // flights that never left the gate stay out of the log
    getSessions().then(all => setSessions(all.filter(s => s.flight?.legs.some(leg => leg.from !== leg.to)).sort((a, b) => b.startedAt - a.startedAt)));
  }, [dataVersion]);

  const subjectById = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);

  // each route drawn once no matter how often it was flown
  const { routes, markers, frame } = useMemo(() => {
    const legs = sessions.flatMap(s => s.flight!.legs);
    const seen = new Set<string>();
    const routes: MapRoute[] = [];
    for (const leg of legs) {
      const key = [leg.from, leg.to].sort().join('-');
      if (leg.from === leg.to || seen.has(key)) continue;
      seen.add(key);
      routes.push({ points: routePoints(getAirport(leg.from), getAirport(leg.to)), variant: 'history' });
    }
    const airports = [...new Set(legs.flatMap(leg => [leg.from, leg.to]))].map(getAirport);
    const markers: MapMarker[] = airports.map(a => ({ lon: a.lon, lat: a.lat, variant: 'city' }));
    const home = getAirport(appSettings.homeAirport);
    const frame: LonLat[] = airports.length ? airports.map(a => [a.lon, a.lat]) : [[home.lon, home.lat]];
    return { routes, markers, frame };
  }, [sessions, appSettings.homeAirport]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-8 md:pb-12 lg:px-10">
      <h1 className="text-xl font-medium">Logbook</h1>

      <div className="hairline relative mt-8 h-[380px] overflow-hidden rounded-3xl border">
        <WorldMap className="absolute inset-0" frame={frame} minSpan={90} dotColor="#3a3a3a" routes={routes} markers={markers} />
        <p className="label absolute left-6 top-5">Your routes</p>
      </div>

      <h2 className="label mb-4 mt-12">Flights</h2>
      {sessions.length === 0 ? (
        <p className="text-sm text-neutral-500">No flights yet. Board one from the Fly page and it will show up here.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.slice(0, shown).map(session => {
            const flight = session.flight!;
            const first = getAirport(flight.legs[0].from);
            const last = getAirport(flight.legs[flight.legs.length - 1].to);
            const km = flight.legs.reduce((acc, leg) => acc + leg.distanceKm, 0);
            const subject = subjectById.get(session.subjectId);
            return (
              <li key={session.id} className="flex items-center overflow-hidden rounded-2xl border border-white/[0.07] bg-[#070707] transition-colors hover:border-white/15">
                <div className="flex min-w-0 flex-1 items-center gap-6 px-5 py-4">
                  <div className="w-16 shrink-0 text-xs text-neutral-500">
                    <div className="text-white">{new Date(session.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                    <div className="mt-0.5">{flight.flightNo}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium">{first.code}</span>
                    <span className="h-px w-8 border-t border-dashed border-white/25" />
                    <span className="text-lg font-medium">{last.code}</span>
                  </div>
                  <div className="hidden min-w-0 flex-1 sm:block">
                    <div className="truncate text-sm text-neutral-300">
                      {first.city} to {last.city}
                      {flight.legs.length > 1 && <span className="text-neutral-600">, {flight.legs.length} legs</span>}
                    </div>
                    {subject && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                        <span className={cn('h-1.5 w-1.5 rounded-full', subject.color)} />
                        {subject.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-6 border-l border-white/[0.07] px-5 py-4 text-right text-sm tabular-nums">
                  <div className="w-16 text-white">{formatDuration(session.focusDuration)}</div>
                  <div className="w-24 text-neutral-400">{formatDistance(km, appSettings.distanceUnit)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {sessions.length > shown && (
        <button type="button" onClick={() => setShown(n => n + PAGE_SIZE)} className="btn-ghost mt-6">
          Show more flights
        </button>
      )}
    </div>
  );
};

export default Logbook;
