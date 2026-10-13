import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import landTopology from 'world-atlas/land-110m.json';
import { LonLat } from '@/lib/flights';
import { cn } from '@/lib/utils';

export interface GlobeMarker {
  at: LonLat;
  label?: string;
  variant: 'here' | 'origin' | 'dest' | 'city';
}

export type CameraMode = 'follow' | 'overview';

interface Globe3DProps {
  // the leg the plane is flying, drawn as a raised arc
  route: { from: LonLat; to: LonLat } | null;
  // share of the route flown, from 0 to 1
  progress?: number;
  // hide the planned arc for open and mystery flights
  hideRoute?: boolean;
  showPlane?: boolean;
  history?: { from: LonLat; to: LonLat }[];
  markers?: GlobeMarker[];
  // where the overview camera looks when there is no route yet
  focus?: LonLat;
  camera?: CameraMode;
  className?: string;
}

const ACCENT = 0xff7a21;
const FPS = 30;
const INTRO_MS = 3500;
const DOT_COUNT = 500_000;

const toVec = ([lon, lat]: LonLat, r = 1) => {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(phi) * Math.cos(lambda), r * Math.sin(phi), -r * Math.cos(phi) * Math.sin(lambda));
};

// arc height grows with distance so long hauls visibly lift off the globe
const arcPeak = (angle: number) => 0.015 + 0.12 * (angle / Math.PI);

function arcPoint(a: THREE.Vector3, b: THREE.Vector3, angle: number, t: number): THREE.Vector3 {
  const p = angle < 1e-6 ? a.clone() : a.clone().multiplyScalar(Math.sin((1 - t) * angle) / Math.sin(angle)).add(b.clone().multiplyScalar(Math.sin(t * angle) / Math.sin(angle)));
  return p.normalize().multiplyScalar(1 + Math.sin(Math.PI * t) * arcPeak(angle));
}

function arcPositions(from: LonLat, to: LonLat, until = 1, steps = 160): number[] {
  const a = toVec(from);
  const b = toVec(to);
  const angle = a.angleTo(b);
  const count = Math.max(2, Math.ceil(steps * until));
  const out: number[] = [];
  for (let i = 0; i <= count; i++) {
    const p = arcPoint(a, b, angle, (i / count) * until);
    out.push(p.x, p.y, p.z);
  }
  return out;
}

// land mask drawn once into a canvas so each lattice point can ask whether it sits on land
let landDots: Float32Array | null = null;
function buildLandDots(): Float32Array {
  if (landDots) return landDots;
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const topology = landTopology as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topology, topology.objects.land);
  const projection = geoEquirectangular().scale(width / (2 * Math.PI)).translate([width / 2, height / 2]);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  geoPath(projection, ctx)(land);
  ctx.fill();
  const pixels = ctx.getImageData(0, 0, width, height).data;

  // a fibonacci lattice spreads dots evenly, so the poles are not crowded like a lat lon grid
  const positions: number[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < DOT_COUNT; i++) {
    const y = 1 - (i / (DOT_COUNT - 1)) * 2;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = ((((i * golden * 180) / Math.PI) % 360) + 540) % 360 - 180;
    const px = Math.floor(((lon + 180) / 360) * (width - 1));
    const py = Math.floor(((90 - lat) / 180) * (height - 1));
    if (pixels[(py * width + px) * 4 + 3] > 128) {
      const v = toVec([lon, lat], 1.002);
      positions.push(v.x, v.y, v.z);
    }
  }
  landDots = new Float32Array(positions);
  return landDots;
}

function dotSprite(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

// a flat silhouette of a jet, extruded so it has a little thickness when the camera tilts
function planeGeometry(): THREE.BufferGeometry {
  const half: [number, number][] = [
    [11, 0], [9.6, 0.8], [7, 1.3], [2.5, 1.3], [-3, 10], [-5.6, 10], [-2.4, 1.3], [-7.4, 1.2], [-9.8, 5], [-11.3, 5], [-10.4, 1.1], [-11, 0],
  ];
  const outline = [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [x, -y] as [number, number])];
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.2, bevelSegments: 1 });
  geometry.translate(0, 0, -0.45);
  geometry.scale(0.0012, 0.0012, 0.0012);
  return geometry;
}

const atmosphereMaterial = () =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: { color: { value: new THREE.Color(ACCENT) } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 color;
      varying vec3 vNormal;
      void main() {
        float rim = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(color, 1.0) * rim * 0.28;
      }`,
  });

const Globe3D = ({ route, progress = 0, hideRoute = false, showPlane = false, history = [], markers = [], focus, camera = 'follow', className }: Globe3DProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const props = useRef({ route, progress, hideRoute, showPlane, history, markers, focus, camera });
  props.current = { route, progress, hideRoute, showPlane, history, markers, focus, camera };
  const sceneRef = useRef<{ rebuild: () => void } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const labels = labelsRef.current;
    if (!host || !labels) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.005, 100);

    scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.998, 96, 64), new THREE.MeshBasicMaterial({ color: 0x060606 })));
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 48), atmosphereMaterial()));

    const dots = new THREE.BufferGeometry();
    dots.setAttribute('position', new THREE.BufferAttribute(buildLandDots(), 3));
    const sprite = dotSprite();
    scene.add(new THREE.Points(dots, new THREE.PointsMaterial({ color: 0x8c8c8c, size: 0.0034, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true })));

    // faint stars far away for depth
    const starPositions: number[] = [];
    for (let i = 0; i < 900; i++) {
      const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(30 + Math.random() * 20);
      starPositions.push(v.x, v.y, v.z);
    }
    const stars = new THREE.BufferGeometry();
    stars.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0x8a8a8a, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.45 })));

    scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    scene.add(sun);

    const plane = new THREE.Mesh(planeGeometry(), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9a9a9a }));
    plane.matrixAutoUpdate = false;
    scene.add(plane);

    const lineMaterials: LineMaterial[] = [];
    const makeLine = (color: number, width: number, opacity: number, dashed: boolean) => {
      const material = new LineMaterial({ color, linewidth: width, transparent: true, opacity, dashed, dashSize: 0.012, gapSize: 0.018, worldUnits: false });
      lineMaterials.push(material);
      return material;
    };
    const plannedMaterial = makeLine(0xffffff, 1.5, 0.35, true);
    const flownMaterial = makeLine(ACCENT, 3, 1, false);
    const historyMaterial = makeLine(ACCENT, 2, 0.4, false);
    let planned: Line2 | null = null;
    let flown: Line2 | null = null;
    const historyLines: Line2[] = [];
    let flownProgress = -1;

    const removeLine = (line: Line2 | null) => {
      if (!line) return;
      scene.remove(line);
      line.geometry.dispose();
    };

    const lineFrom = (positions: number[], material: LineMaterial) => {
      const geometry = new LineGeometry();
      geometry.setPositions(positions);
      const line = new Line2(geometry, material);
      line.computeLineDistances();
      scene.add(line);
      return line;
    };

    // static pieces rebuild only when the route or history changes
    const rebuild = () => {
      const p = props.current;
      removeLine(planned);
      planned = null;
      historyLines.splice(0).forEach(removeLine);
      if (p.route && !p.hideRoute) planned = lineFrom(arcPositions(p.route.from, p.route.to), plannedMaterial);
      for (const leg of p.history) historyLines.push(lineFrom(arcPositions(leg.from, leg.to), historyMaterial));
      flownProgress = -1;
      labels.replaceChildren(
        ...p.markers.map(marker => {
          const el = document.createElement('div');
          el.className = `globe-marker globe-marker-${marker.variant}`;
          el.innerHTML = `<span class="globe-marker-dot"></span>${marker.label ? `<span class="globe-marker-label">${marker.label}</span>` : ''}`;
          return el;
        })
      );
    };
    sceneRef.current = { rebuild };
    rebuild();

    let width = 1;
    let height = 1;
    const resize = () => {
      width = host.clientWidth || 1;
      height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = `${width}px`;
      renderer.domElement.style.height = `${height}px`;
      cam.aspect = width / height;
      cam.updateProjectionMatrix();
      for (const m of lineMaterials) m.resolution.set(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const start = performance.now();
    let shown = props.current.progress;
    let frame = 0;
    let last = 0;
    const camPos = new THREE.Vector3(0, 0, 3.2);
    const camUp = new THREE.Vector3(0, 1, 0);
    const camLook = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    let first = true;

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (now - last < 1000 / FPS) return;
      // easing is time based so slow machines catch up instead of lagging behind
      const dt = Math.min(0.5, (now - (last || now)) / 1000);
      last = now;
      const p = props.current;

      // ease the plane toward the latest progress so it glides instead of jumping between ticks
      if (Math.abs(p.progress - shown) > 0.2) shown = p.progress;
      shown += (p.progress - shown) * (1 - Math.exp(-dt / 0.4));

      let planePos: THREE.Vector3 | null = null;
      let forward: THREE.Vector3 | null = null;
      if (p.route) {
        const a = toVec(p.route.from);
        const b = toVec(p.route.to);
        const angle = a.angleTo(b);
        const t = Math.min(1, Math.max(0, shown));
        planePos = arcPoint(a, b, angle, t);
        const ahead = arcPoint(a, b, angle, Math.min(1, t + 0.002));
        const behind = arcPoint(a, b, angle, Math.max(0, t - 0.002));
        forward = ahead.sub(behind).normalize();
        if (forward.lengthSq() < 1e-9) forward = b.clone().sub(a).normalize();

        if (Math.abs(flownProgress - t) > 0.0015) {
          removeLine(flown);
          flown = t > 0.002 ? lineFrom(arcPositions(p.route.from, p.route.to, t), flownMaterial) : null;
          flownProgress = t;
        }
      } else if (flown) {
        removeLine(flown);
        flown = null;
      }

      // the camera height for this route also sets the plane size so it looks the same on every flight
      const span = p.route ? toVec(p.route.from).angleTo(toVec(p.route.to)) : 0;
      const chaseHeight = Math.min(0.62, Math.max(0.4, 0.35 + span * 0.25));

      plane.visible = !!(p.showPlane && planePos && forward);
      if (plane.visible && planePos && forward) {
        const up = planePos.clone().normalize();
        const right = new THREE.Vector3().crossVectors(forward, up).normalize();
        const fwd = new THREE.Vector3().crossVectors(up, right).normalize();
        const size = chaseHeight / 0.6;
        plane.matrix
          .makeBasis(fwd, right.negate(), up)
          .scale(new THREE.Vector3(size, size, size))
          .setPosition(planePos.clone().add(up.clone().multiplyScalar(0.004)));
      }

      // follow the plane from above and behind, or step back to see the whole route
      const intro = now - start < INTRO_MS;
      const follow = p.camera === 'follow' && plane.visible && planePos && forward && !intro;
      let targetPos: THREE.Vector3;
      let targetLook: THREE.Vector3;
      let targetUp: THREE.Vector3;
      if (follow && planePos && forward && p.route) {
        // longer routes pull the chase camera higher so more of the way ahead stays in view
        const up = planePos.clone().normalize();
        const height = chaseHeight;
        // a steep oblique view from behind, the plane sits a little above the middle with the horizon curving at the top
        targetPos = planePos.clone().add(up.clone().multiplyScalar(height)).sub(forward.clone().multiplyScalar(height * 0.5));
        targetLook = planePos.clone().sub(forward.clone().multiplyScalar(height * 0.12));
        targetUp = forward.clone();
      } else {
        let center: THREE.Vector3;
        let spread = 0.6;
        if (p.route) {
          const a = toVec(p.route.from);
          const b = toVec(p.route.to);
          spread = Math.max(0.35, a.angleTo(b));
          center = p.hideRoute && planePos ? planePos.clone().normalize() : a.clone().add(b).normalize();
          if (center.lengthSq() < 1e-6) center = a.clone();
        } else {
          center = toVec(p.focus ?? [127, 37]);
        }
        const distance = 1 + Math.min(2.6, 0.55 + spread * 1.25);
        targetPos = center.clone().multiplyScalar(distance);
        targetLook = center.clone().multiplyScalar(0.15);
        targetUp = new THREE.Vector3(0, 1, 0);
      }
      if (first) {
        camPos.copy(targetPos);
        camLook.copy(targetLook);
        camUp.copy(targetUp);
        first = false;
      }
      const k = 1 - Math.exp(-dt / (intro ? 0.5 : 0.9));
      camPos.lerp(targetPos, k);
      camLook.lerp(targetLook, k);
      camUp.lerp(targetUp, k).normalize();
      cam.position.copy(camPos);
      cam.up.copy(camUp);
      cam.lookAt(camLook);
      sun.position.copy(camPos).add(new THREE.Vector3(0.5, 1, 0.3));

      renderer.render(scene, cam);

      // labels sit in html so they use the app font, hidden when their point turns away
      const children = labels.children;
      for (let i = 0; i < p.markers.length && i < children.length; i++) {
        const el = children[i] as HTMLElement;
        const world = toVec(p.markers[i].at, 1.003);
        const facing = world.clone().normalize().dot(tmp.copy(camPos).sub(world).normalize()) > 0.05;
        const screen = world.clone().project(cam);
        const visible = facing && screen.z < 1 && Math.abs(screen.x) < 1.2 && Math.abs(screen.y) < 1.2;
        el.style.opacity = visible ? '1' : '0';
        el.style.transform = `translate(${((screen.x + 1) / 2) * width}px, ${((1 - screen.y) / 2) * height}px)`;
      }
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      sceneRef.current = null;
      scene.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach(m => m.dispose());
        else material?.dispose();
      });
      sprite.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const routeKey = route ? `${route.from.join()}|${route.to.join()}` : '';
  const historyKey = history.map(h => `${h.from.join()}|${h.to.join()}`).join(';');
  const markerKey = markers.map(m => `${m.at.join()}${m.label}${m.variant}`).join(';');
  useEffect(() => {
    sceneRef.current?.rebuild();
  }, [routeKey, historyKey, markerKey, hideRoute]);

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <div ref={hostRef} className="absolute inset-0" />
      <div ref={labelsRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
    </div>
  );
};

export default Globe3D;
