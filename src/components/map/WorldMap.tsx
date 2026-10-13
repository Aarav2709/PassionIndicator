import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { LAND_PATH, WORLD_HEIGHT, WORLD_WIDTH } from '@/data/worldDots';
import { LonLat, project } from '@/lib/flights';
import { cn } from '@/lib/utils';

export interface MapRoute {
  points: LonLat[];
  variant: 'planned' | 'flown' | 'history' | 'preview';
}

export interface MapMarker {
  lon: number;
  lat: number;
  label?: string;
  variant: 'here' | 'origin' | 'dest' | 'city';
}

interface WorldMapProps {
  // points the view should keep in frame
  frame: LonLat[];
  // smallest width of the view in degrees, so short hops do not zoom in too far
  minSpan?: number;
  routes?: MapRoute[];
  markers?: MapMarker[];
  plane?: { lon: number; lat: number; heading: number };
  dotColor?: string;
  className?: string;
}

const ACCENT = '#FF7A21';

// plane silhouette pointing along positive x, about 22 units long
export const PLANE_PATH =
  'M11 0C11-1 9-1.4 7-1.4L-9-1.2C-10.5-1.2-11-.6-11 0S-10.5 1.2-9 1.2L7 1.4C9 1.4 11 1 11 0Z' +
  'M2.5-1.3-3-10h-2.6l2.4 8.7ZM2.5 1.3-3 10h-2.6l2.4-8.7Z' +
  'M-7.4-1.2-9.8-5.2h-1.6l1 4ZM-7.4 1.2-9.8 5.2h-1.6l1-4Z';

const DOT_SPACING_PX = 6;
const DOT_RADIUS_PX = 1.25;

// land drawn three times side by side so routes across the date line still sit on a map
const Land = memo(({ fill }: { fill: string }) => (
  <g fill={fill}>
    {[-WORLD_WIDTH, 0, WORLD_WIDTH].map(offset => (
      <path key={offset} d={LAND_PATH} transform={`translate(${offset} 0)`} />
    ))}
  </g>
));

function toPath(points: LonLat[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${project(p).map(n => n.toFixed(2)).join(' ')}`).join('');
}

const WorldMap = ({ frame, minSpan = 40, routes = [], markers = [], plane, dotColor = '#3a3a3a', className }: WorldMapProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 16, h: 9 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // fit the frame points, then stretch the box to the container shape so nothing is cropped
  const view = useMemo(() => {
    const projected = frame.map(project);
    const xs = projected.map(p => p[0]);
    const ys = projected.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    let w = Math.max(maxX - minX, minSpan) * 1.5;
    let h = Math.max(maxY - minY, minSpan * 0.35) * 1.6;
    const aspect = size.w / size.h;
    if (w / h < aspect) w = h * aspect;
    else h = w / aspect;
    if (w > WORLD_WIDTH * 1.1) {
      w = WORLD_WIDTH * 1.1;
      h = w / aspect;
    }
    const cx = (minX + maxX) / 2;
    // a view taller than the world just centres it, otherwise keep the frame from drifting off the map
    const cy = h >= WORLD_HEIGHT ? WORLD_HEIGHT / 2 : Math.min(Math.max((minY + maxY) / 2, h / 2 - 8), WORLD_HEIGHT - h / 2 + 8);
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }, [frame, minSpan, size]);

  const unit = view.w / 100;
  const patternId = useId().replace(/:/g, '');
  // the dot pattern is sized in screen pixels so the dot matrix looks the same at any zoom
  const unitsPerPx = view.w / size.w;
  const spacing = DOT_SPACING_PX * unitsPerPx;

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id={patternId} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
            <circle cx={spacing / 2} cy={spacing / 2} r={DOT_RADIUS_PX * unitsPerPx} fill={dotColor} />
          </pattern>
        </defs>
        <Land fill="#0a0a0a" />
        <Land fill={`url(#${patternId})`} />

        {routes.map((route, i) => (
          <path
            key={i}
            d={toPath(route.points)}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            stroke={route.variant === 'flown' || route.variant === 'history' ? ACCENT : '#ffffff'}
            strokeOpacity={route.variant === 'history' ? 0.35 : route.variant === 'flown' ? 1 : route.variant === 'preview' ? 0.45 : 0.25}
            strokeWidth={route.variant === 'flown' ? 2.5 : 1.5}
            strokeDasharray={route.variant === 'planned' || route.variant === 'preview' ? '2 5' : undefined}
          />
        ))}

        {markers.map((marker, i) => {
          const [x, y] = project([marker.lon, marker.lat]);
          const r = marker.variant === 'city' ? unit * 0.35 : unit * 0.55;
          const color = marker.variant === 'here' || marker.variant === 'dest' ? ACCENT : '#ffffff';
          return (
            <g key={i}>
              {marker.variant === 'here' && (
                <circle cx={x} cy={y} r={r} fill={ACCENT} opacity={0.5}>
                  <animate attributeName="r" from={r} to={r * 5} dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={x} cy={y} r={r} fill={marker.variant === 'city' ? '#ffffff' : '#000'} stroke={color} strokeWidth={unit * 0.25} opacity={marker.variant === 'city' ? 0.6 : 1} />
              {marker.label && (
                <text
                  x={x}
                  y={y - r - unit * 0.9}
                  textAnchor="middle"
                  fontSize={unit * 1.7}
                  fontWeight={600}
                  letterSpacing={unit * 0.15}
                  fill="#ffffff"
                  stroke="#000"
                  strokeWidth={unit * 0.6}
                  paintOrder="stroke"
                >
                  {marker.label}
                </text>
              )}
            </g>
          );
        })}

        {plane && (
          <g transform={`translate(${project([plane.lon, plane.lat]).join(' ')}) rotate(${plane.heading}) scale(${(unit * 3.2) / 22})`}>
            <path d={PLANE_PATH} fill="#ffffff" stroke="#000" strokeWidth={1.2} paintOrder="stroke" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default WorldMap;
