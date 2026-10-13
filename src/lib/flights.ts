import { LAT_TOP } from '@/data/worldDots';
import { DistanceUnit, SpeedUnit } from './types';

export interface Airport {
  code: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

const A = (code: string, city: string, country: string, lat: number, lon: number): Airport => ({ code, city, country, lat, lon });

export const AIRPORTS: Airport[] = [
  A('ICN', 'Seoul', 'South Korea', 37.46, 126.44),
  A('PUS', 'Busan', 'South Korea', 35.18, 128.94),
  A('CJU', 'Jeju', 'South Korea', 33.51, 126.49),
  A('HND', 'Tokyo', 'Japan', 35.55, 139.78),
  A('KIX', 'Osaka', 'Japan', 34.43, 135.23),
  A('FUK', 'Fukuoka', 'Japan', 33.59, 130.45),
  A('CTS', 'Sapporo', 'Japan', 42.78, 141.69),
  A('OKA', 'Okinawa', 'Japan', 26.2, 127.65),
  A('PEK', 'Beijing', 'China', 40.08, 116.58),
  A('PVG', 'Shanghai', 'China', 31.14, 121.81),
  A('CAN', 'Guangzhou', 'China', 23.39, 113.3),
  A('HKG', 'Hong Kong', 'China', 22.31, 113.91),
  A('TPE', 'Taipei', 'Taiwan', 25.08, 121.23),
  A('ULN', 'Ulaanbaatar', 'Mongolia', 47.65, 106.82),
  A('VVO', 'Vladivostok', 'Russia', 43.4, 132.15),
  A('MNL', 'Manila', 'Philippines', 14.51, 121.02),
  A('BKK', 'Bangkok', 'Thailand', 13.69, 100.75),
  A('HAN', 'Hanoi', 'Vietnam', 21.22, 105.81),
  A('SGN', 'Ho Chi Minh City', 'Vietnam', 10.82, 106.65),
  A('KUL', 'Kuala Lumpur', 'Malaysia', 2.74, 101.71),
  A('SIN', 'Singapore', 'Singapore', 1.36, 103.99),
  A('CGK', 'Jakarta', 'Indonesia', -6.13, 106.66),
  A('DPS', 'Bali', 'Indonesia', -8.75, 115.17),
  A('DEL', 'Delhi', 'India', 28.56, 77.1),
  A('BOM', 'Mumbai', 'India', 19.09, 72.87),
  A('BLR', 'Bengaluru', 'India', 13.2, 77.71),
  A('MAA', 'Chennai', 'India', 12.99, 80.17),
  A('CCU', 'Kolkata', 'India', 22.65, 88.45),
  A('HYD', 'Hyderabad', 'India', 17.24, 78.43),
  A('JAI', 'Jaipur', 'India', 26.82, 75.81),
  A('AMD', 'Ahmedabad', 'India', 23.07, 72.63),
  A('GOI', 'Goa', 'India', 15.38, 73.83),
  A('COK', 'Kochi', 'India', 10.15, 76.4),
  A('LKO', 'Lucknow', 'India', 26.76, 80.89),
  A('PNQ', 'Pune', 'India', 18.58, 73.92),
  A('IXC', 'Chandigarh', 'India', 30.67, 76.79),
  A('ATQ', 'Amritsar', 'India', 31.71, 74.8),
  A('SXR', 'Srinagar', 'India', 33.99, 74.77),
  A('KTM', 'Kathmandu', 'Nepal', 27.7, 85.36),
  A('DAC', 'Dhaka', 'Bangladesh', 23.84, 90.4),
  A('CMB', 'Colombo', 'Sri Lanka', 7.18, 79.88),
  A('MLE', 'Male', 'Maldives', 4.19, 73.53),
  A('KHI', 'Karachi', 'Pakistan', 24.91, 67.16),
  A('DXB', 'Dubai', 'UAE', 25.25, 55.36),
  A('AUH', 'Abu Dhabi', 'UAE', 24.43, 54.65),
  A('DOH', 'Doha', 'Qatar', 25.27, 51.61),
  A('RUH', 'Riyadh', 'Saudi Arabia', 24.96, 46.7),
  A('TLV', 'Tel Aviv', 'Israel', 32.01, 34.89),
  A('IST', 'Istanbul', 'Turkey', 41.26, 28.74),
  A('CAI', 'Cairo', 'Egypt', 30.12, 31.41),
  A('LHR', 'London', 'United Kingdom', 51.47, -0.45),
  A('MAN', 'Manchester', 'United Kingdom', 53.35, -2.27),
  A('EDI', 'Edinburgh', 'United Kingdom', 55.95, -3.37),
  A('DUB', 'Dublin', 'Ireland', 53.42, -6.27),
  A('CDG', 'Paris', 'France', 49.01, 2.55),
  A('NCE', 'Nice', 'France', 43.66, 7.21),
  A('AMS', 'Amsterdam', 'Netherlands', 52.31, 4.76),
  A('BRU', 'Brussels', 'Belgium', 50.9, 4.48),
  A('FRA', 'Frankfurt', 'Germany', 50.04, 8.56),
  A('MUC', 'Munich', 'Germany', 48.35, 11.79),
  A('BER', 'Berlin', 'Germany', 52.36, 13.5),
  A('ZRH', 'Zurich', 'Switzerland', 47.46, 8.55),
  A('VIE', 'Vienna', 'Austria', 48.11, 16.57),
  A('PRG', 'Prague', 'Czechia', 50.1, 14.26),
  A('WAW', 'Warsaw', 'Poland', 52.17, 20.97),
  A('BUD', 'Budapest', 'Hungary', 47.43, 19.26),
  A('CPH', 'Copenhagen', 'Denmark', 55.62, 12.65),
  A('OSL', 'Oslo', 'Norway', 60.19, 11.1),
  A('ARN', 'Stockholm', 'Sweden', 59.65, 17.92),
  A('HEL', 'Helsinki', 'Finland', 60.32, 24.96),
  A('KEF', 'Reykjavik', 'Iceland', 63.99, -22.62),
  A('MAD', 'Madrid', 'Spain', 40.47, -3.56),
  A('BCN', 'Barcelona', 'Spain', 41.3, 2.08),
  A('LIS', 'Lisbon', 'Portugal', 38.77, -9.13),
  A('FCO', 'Rome', 'Italy', 41.8, 12.25),
  A('MXP', 'Milan', 'Italy', 45.63, 8.72),
  A('ATH', 'Athens', 'Greece', 37.94, 23.94),
  A('CMN', 'Casablanca', 'Morocco', 33.37, -7.59),
  A('LOS', 'Lagos', 'Nigeria', 6.58, 3.32),
  A('ACC', 'Accra', 'Ghana', 5.61, -0.17),
  A('ADD', 'Addis Ababa', 'Ethiopia', 8.98, 38.8),
  A('NBO', 'Nairobi', 'Kenya', -1.32, 36.93),
  A('JNB', 'Johannesburg', 'South Africa', -26.14, 28.24),
  A('CPT', 'Cape Town', 'South Africa', -33.97, 18.6),
  A('JFK', 'New York', 'United States', 40.64, -73.78),
  A('BOS', 'Boston', 'United States', 42.36, -71.01),
  A('IAD', 'Washington', 'United States', 38.95, -77.46),
  A('ORD', 'Chicago', 'United States', 41.98, -87.9),
  A('ATL', 'Atlanta', 'United States', 33.64, -84.43),
  A('MIA', 'Miami', 'United States', 25.79, -80.29),
  A('DFW', 'Dallas', 'United States', 32.9, -97.04),
  A('DEN', 'Denver', 'United States', 39.86, -104.67),
  A('LAS', 'Las Vegas', 'United States', 36.08, -115.15),
  A('LAX', 'Los Angeles', 'United States', 33.94, -118.41),
  A('SFO', 'San Francisco', 'United States', 37.62, -122.38),
  A('SEA', 'Seattle', 'United States', 47.45, -122.31),
  A('ANC', 'Anchorage', 'United States', 61.17, -149.99),
  A('HNL', 'Honolulu', 'United States', 21.32, -157.92),
  A('YYZ', 'Toronto', 'Canada', 43.68, -79.63),
  A('YUL', 'Montreal', 'Canada', 45.47, -73.74),
  A('YVR', 'Vancouver', 'Canada', 49.19, -123.18),
  A('MEX', 'Mexico City', 'Mexico', 19.44, -99.07),
  A('CUN', 'Cancun', 'Mexico', 21.04, -86.87),
  A('BOG', 'Bogota', 'Colombia', 4.7, -74.15),
  A('LIM', 'Lima', 'Peru', -12.02, -77.11),
  A('SCL', 'Santiago', 'Chile', -33.39, -70.79),
  A('GRU', 'Sao Paulo', 'Brazil', -23.43, -46.47),
  A('GIG', 'Rio de Janeiro', 'Brazil', -22.81, -43.25),
  A('EZE', 'Buenos Aires', 'Argentina', -34.82, -58.54),
  A('SYD', 'Sydney', 'Australia', -33.95, 151.18),
  A('MEL', 'Melbourne', 'Australia', -37.67, 144.84),
  A('BNE', 'Brisbane', 'Australia', -27.38, 153.12),
  A('PER', 'Perth', 'Australia', -31.94, 115.97),
  A('AKL', 'Auckland', 'New Zealand', -37.01, 174.79),
  A('CHC', 'Christchurch', 'New Zealand', -43.49, 172.53),
  A('NAN', 'Nadi', 'Fiji', -17.76, 177.44),
];

const BY_CODE = new Map(AIRPORTS.map(a => [a.code, a]));

export const DEFAULT_AIRPORT = 'ICN';

export function getAirport(code: string): Airport {
  return BY_CODE.get(code) ?? BY_CODE.get(DEFAULT_AIRPORT)!;
}

// typical jet cruise, plus the slower block speed and ground time airlines use when they publish a schedule
export const CRUISE_KMH = 850;
const BLOCK_KMH = 800;
const OVERHEAD_SECONDS = 40 * 60;
const MIN_FLIGHT_SECONDS = 45 * 60;

export type LonLat = [number, number];

const RAD = Math.PI / 180;
const EARTH_KM = 6371;

function toVec(lat: number, lon: number): [number, number, number] {
  const phi = lat * RAD;
  const lambda = lon * RAD;
  return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
}

function angleBetween(a: Airport | { lat: number; lon: number }, b: Airport | { lat: number; lon: number }): number {
  const va = toVec(a.lat, a.lon);
  const vb = toVec(b.lat, b.lon);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  return Math.acos(dot);
}

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  return angleBetween(a, b) * EARTH_KM;
}

// point a fraction t of the way along the great circle from a to b
export function interpolate(a: Airport, b: Airport, t: number): { lat: number; lon: number } {
  const omega = angleBetween(a, b);
  if (omega < 1e-9) return { lat: a.lat, lon: a.lon };
  const va = toVec(a.lat, a.lon);
  const vb = toVec(b.lat, b.lon);
  const s = Math.sin(omega);
  const k1 = Math.sin((1 - t) * omega) / s;
  const k2 = Math.sin(t * omega) / s;
  const x = k1 * va[0] + k2 * vb[0];
  const y = k1 * va[1] + k2 * vb[1];
  const z = k1 * va[2] + k2 * vb[2];
  return { lat: Math.atan2(z, Math.hypot(x, y)) / RAD, lon: Math.atan2(y, x) / RAD };
}

// great circle as lon lat points, longitudes stay continuous so routes over the date line do not jump
export function routePoints(a: Airport, b: Airport, steps = 64): LonLat[] {
  const points: LonLat[] = [];
  let prevLon = a.lon;
  for (let i = 0; i <= steps; i++) {
    const p = interpolate(a, b, i / steps);
    let lon = p.lon;
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    points.push([lon, p.lat]);
    prevLon = lon;
  }
  return points;
}

export function project([lon, lat]: LonLat): [number, number] {
  return [lon + 180, LAT_TOP - lat];
}

export function nearestAirport(point: { lat: number; lon: number }): Airport {
  let best = AIRPORTS[0];
  let bestDist = Infinity;
  for (const airport of AIRPORTS) {
    const d = distanceKm(point, airport);
    if (d < bestDist) {
      best = airport;
      bestDist = d;
    }
  }
  return best;
}

// block time an airline would publish for this distance, rounded to five minutes
export function realisticFlightSeconds(km: number): number {
  const seconds = Math.max(MIN_FLIGHT_SECONDS, OVERHEAD_SECONDS + (km / BLOCK_KMH) * 3600);
  return Math.round(seconds / 300) * 300;
}

export interface RouteOption {
  airport: Airport;
  km: number;
  seconds: number;
}

// real routes whose flight time is closest to the time the user asked for
export function suggestDestinations(fromCode: string, seconds: number, count = 5): RouteOption[] {
  const from = getAirport(fromCode);
  return AIRPORTS.filter(a => a.code !== from.code)
    .map(a => {
      const km = distanceKm(from, a);
      return { airport: a, km, seconds: realisticFlightSeconds(km) };
    })
    .sort((x, y) => Math.abs(Math.log(x.seconds / seconds)) - Math.abs(Math.log(y.seconds / seconds)))
    .slice(0, count);
}

export function randomDestination(fromCode: string, seconds: number): Airport {
  const options = suggestDestinations(fromCode, seconds, 6);
  return options[Math.floor(Math.random() * options.length)].airport;
}

// open flights head somewhere far away so they never arrive too early
export function longHaulDestination(fromCode: string): Airport {
  const from = getAirport(fromCode);
  const far = AIRPORTS.filter(a => distanceKm(from, a) > 7000);
  const pool = far.length > 0 ? far : [...AIRPORTS].sort((x, y) => distanceKm(from, y) - distanceKm(from, x)).slice(0, 5);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function makeFlightNumber(): string {
  return `PI ${100 + Math.floor(Math.random() * 900)}`;
}

export interface FlightProfile {
  // share of the route flown, from 0 to 1
  progress: number;
  speedKmh: number;
  altitudeFt: number;
  phase: 'taxi' | 'climb' | 'cruise' | 'descent';
}

const TAKEOFF_KMH = 290;
const TAXI_KMH = 30;

function cruiseAltitude(km: number): number {
  if (km < 600) return 24_000;
  if (km < 1500) return 31_000;
  if (km < 4000) return 35_000;
  return 38_000;
}

// a trapezoid speed profile, the plane speeds up while climbing, holds cruise and slows on the way down
export function flightProfile(elapsed: number, total: number | null, routeKm: number): FlightProfile {
  const altitude = cruiseAltitude(routeKm);

  if (total === null) {
    const climb = 15 * 60;
    const share = Math.min(1, elapsed / climb);
    const flownKm = (CRUISE_KMH / 3600) * (elapsed < climb ? (elapsed * elapsed) / (2 * climb) : elapsed - climb / 2);
    return {
      progress: routeKm > 0 ? Math.min(1, flownKm / routeKm) : 1,
      speedKmh: TAKEOFF_KMH + (CRUISE_KMH - TAKEOFF_KMH) * share,
      altitudeFt: Math.round((altitude * share) / 100) * 100,
      phase: share < 1 ? 'climb' : 'cruise',
    };
  }

  // the plane taxis out at the start and in at the end, the rest of the block time is airborne
  const taxiOut = Math.min(8 * 60, total * 0.06);
  const taxiIn = Math.min(7 * 60, total * 0.05);
  const airborne = total - taxiOut - taxiIn;
  if (elapsed < taxiOut || elapsed >= total - taxiIn) {
    const done = elapsed >= total - taxiIn;
    return { progress: done ? 1 : 0, speedKmh: elapsed >= total ? 0 : TAXI_KMH, altitudeFt: 0, phase: 'taxi' };
  }

  const t = (elapsed - taxiOut) / airborne;
  const a = Math.min(0.2, (20 * 60) / airborne);
  const d = Math.min(0.2, (25 * 60) / airborne);
  const v = 1 / (1 - a / 2 - d / 2);
  let progress: number;
  let share: number;
  if (t < a) {
    progress = (v * t * t) / (2 * a);
    share = t / a;
  } else if (t <= 1 - d) {
    progress = v * (a / 2 + (t - a));
    share = 1;
  } else {
    progress = 1 - (v * (1 - t) * (1 - t)) / (2 * d);
    share = (1 - t) / d;
  }
  const cruiseKmh = (routeKm / (airborne / 3600)) * v;
  return {
    progress: Math.min(1, progress),
    speedKmh: TAKEOFF_KMH + (cruiseKmh - TAKEOFF_KMH) * share,
    altitudeFt: Math.round((altitude * share) / 100) * 100,
    phase: t < a ? 'climb' : t <= 1 - d ? 'cruise' : 'descent',
  };
}

const DISTANCE_FACTORS: Record<DistanceUnit, number> = { km: 1, mi: 0.621371, nm: 0.539957 };
const SPEED_FACTORS: Record<SpeedUnit, number> = { kmh: 1, mph: 0.621371, kts: 0.539957 };
const SPEED_LABELS: Record<SpeedUnit, string> = { kmh: 'km/h', mph: 'mph', kts: 'kts' };

export function formatDistance(km: number, unit: DistanceUnit): string {
  return `${Math.round(km * DISTANCE_FACTORS[unit]).toLocaleString()} ${unit}`;
}

export function formatSpeed(kmh: number, unit: SpeedUnit): string {
  return `${Math.round(kmh * SPEED_FACTORS[unit]).toLocaleString()} ${SPEED_LABELS[unit]}`;
}
