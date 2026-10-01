"use client";

import { useEffect, useRef } from "react";
import { Box, Camera, Mesh, Program, Renderer, Transform, Vec3 } from "ogl";
import { LogoMark } from "@/components/Logo";

// The Tessera mark as a 3D hologram: each of the four tesserae is a glass shell
// with lit edges around a stack of finned glass plates, ringed by dark panels
// (after the exploded-cube reference in ../References). The tiles drift apart
// and lock back together on a slow cycle — evidence pulled apart, then
// assembled — and hovering the hero pulls them apart.

// The tile colours of app/icon.svg, exactly.
const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
const TILES: { dir: [number, number]; color: [number, number, number]; z: number }[] = [
  { dir: [0, 1], color: hex("#e8633a"), z: 0.45 }, // top — ember
  { dir: [1, 0], color: hex("#46d6d0"), z: -0.3 }, // right — cyan
  { dir: [0, -1], color: hex("#ece7da"), z: 0.25 }, // bottom — bone
  { dir: [-1, 0], color: hex("#9ba39f"), z: -0.5 }, // left — grey
];

const SCALE = 0.85; // world units per logo offset (12 of the icon's 64)
const SIDE = (11 / 12) * Math.SQRT2 * SCALE * 0.96; // square side of one diamond tile
const PLATES = 5;
const CYCLE = 9; // seconds per apart-and-back cycle

const VERT = /* glsl */ `
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform mat4 modelMatrix;
  uniform mat3 normalMatrix;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

// Tinted glass, alpha-blended so each tile keeps the icon's colour (additive
// light washes bone and grey out to white): a simple key light for form, lit
// edges, fins on the plates, faint scanlines and a soft sweeping band.
// Output is premultiplied; the small emissive term added on top of col * a
// is light the glass gives off, so edges and fins glow a little.
const GLASS = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uKind; // 0 = shell, 1 = plate
  uniform float uOpacity;
  uniform vec2 uRes;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;
  void main() {
    vec3 n = normalize(vNormal);
    float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float fres = pow(1.0 - abs(dot(n, normalize(vView))), 2.0);
    float key = 0.75 + 0.32 * max(dot(n, normalize(vec3(-0.4, 0.7, 0.6))), 0.0);
    float scan = 0.93 + 0.07 * sin(vWorld.y * 70.0 - uTime * 6.0);
    float sweep = exp(-pow((vWorld.y - (mod(uTime * 0.8, 6.0) - 3.0)) * 2.2, 2.0));
    vec3 col;
    float a;
    float glow;
    if (uKind < 0.5) {
      float edge = 1.0 - smoothstep(0.0, 0.04, edgeDist);
      float halo = 1.0 - smoothstep(0.0, 0.12, edgeDist);
      a = edge * 0.85 + fres * 0.12 + 0.06;
      col = mix(uColor * key, vec3(1.0), edge * 0.15);
      glow = edge * 0.3 + halo * 0.1 + fres * 0.08;
    } else {
      float edge = 1.0 - smoothstep(0.0, 0.06, edgeDist);
      float fins = pow(abs(sin(vUv.x * 3.14159 * 14.0)), 4.0);
      a = 0.38 + fins * 0.3 + edge * 0.3;
      col = mix(uColor * key * (0.8 + 0.25 * fins), vec3(1.0), edge * 0.1);
      glow = fins * 0.1 + edge * 0.12;
    }
    float fade = smoothstep(0.5, 0.36, length(gl_FragCoord.xy / uRes - 0.5));
    a = min(a * scan * uOpacity + sweep * 0.1 * uOpacity, 1.0) * fade;
    gl_FragColor = vec4(min(col, 1.0) * a + uColor * glow * uOpacity * fade, a);
  }
`;

// Dark machined panels with a lit bevel and faint circuit lines.
const PANEL = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  uniform vec2 uRes;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float edge = 1.0 - smoothstep(0.0, 0.035, edgeDist);
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);
    float lines = step(0.93, fract(vUv.y * 9.0)) * step(0.35, vUv.x) * step(vUv.x, 0.9);
    vec3 col = mix(vec3(0.09, 0.085, 0.13), vec3(0.2, 0.19, 0.27), vUv.y);
    col += edge * vec3(0.55, 0.45, 1.0) * 0.8 + fres * vec3(0.35, 0.3, 0.8) * 0.35 + lines * vec3(0.45, 0.4, 0.85) * 0.35;
    float a = 0.93 * uOpacity * smoothstep(0.5, 0.36, length(gl_FragCoord.xy / uRes - 0.5));
    gl_FragColor = vec4(col * a, a);
  }
`;

// Deterministic pseudo-random so the panel layout is the same on every load.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export default function HoloMark({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const fallback = fallbackRef.current;
    if (!host) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    } catch {
      return; // no WebGL: the flat mark stays
    }
    const gl = renderer.gl;
    if (!gl) return;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.position = "absolute";
    gl.canvas.style.inset = "0";
    host.appendChild(gl.canvas);
    if (fallback) fallback.style.display = "none";

    const camera = new Camera(gl, { fov: 35 });
    camera.position.set(0, 0, 7);
    const scene = new Transform();
    const group = new Transform();
    group.setParent(scene);

    const res = { value: [1, 1] };
    const time = { value: 0 };

    const glassProgram = (color: [number, number, number], kind: number, opacity: number) => {
      const p = new Program(gl, {
        vertex: VERT,
        fragment: GLASS,
        uniforms: { uColor: { value: color }, uTime: time, uKind: { value: kind }, uOpacity: { value: opacity }, uRes: res },
        transparent: true,
        cullFace: false,
        depthWrite: false,
      });
      p.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      return p;
    };

    const shellGeo = new Box(gl, { width: SIDE, height: SIDE, depth: 0.42 });
    const plateGeo = new Box(gl, { width: SIDE * 0.64, height: SIDE * 0.64, depth: 0.018 });

    const tiles = TILES.map((t) => {
      const node = new Transform();
      node.setParent(group);
      const color = t.color;
      const shell = new Mesh(gl, { geometry: shellGeo, program: glassProgram(color, 0, 1) });
      shell.renderOrder = 2;
      shell.setParent(node);
      const plates = Array.from({ length: PLATES }, (_, i) => {
        const m = new Mesh(gl, { geometry: plateGeo, program: glassProgram(color, 1, 0.75 + 0.25 * Math.sin((i / (PLATES - 1)) * Math.PI)) });
        m.renderOrder = 2;
        m.setParent(node);
        return m;
      });
      return { ...t, node, plates };
    });

    // Panels on a loose shell around the mark, kept off the camera-facing cap
    // so they frame the tiles instead of covering them.
    const rand = rng(7);
    const panelProgram = new Program(gl, { vertex: VERT, fragment: PANEL, uniforms: { uOpacity: { value: 1 }, uRes: res }, transparent: true, cullFace: false });
    panelProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const panels: { mesh: Mesh; dir: Vec3; radius: number }[] = [];
    while (panels.length < 16) {
      const dir = new Vec3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
      if (dir.len() < 0.2) continue;
      dir.normalize();
      if (dir.z > 0.35) continue;
      const geo = new Box(gl, { width: 0.4 + rand() * 0.75, height: 0.25 + rand() * 0.55, depth: 0.04 });
      const mesh = new Mesh(gl, { geometry: geo, program: panelProgram });
      mesh.renderOrder = 1;
      mesh.setParent(group);
      const radius = 1.95 + rand() * 0.55;
      mesh.position.set(dir.x * radius, dir.y * radius, dir.z * radius);
      mesh.lookAt(new Vec3(dir.x, dir.y, dir.z).scale(radius * 2)); // face outward
      panels.push({ mesh, dir, radius });
    }

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / Math.max(h, 1) });
      res.value = [gl.canvas.width, gl.canvas.height];
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // hover anywhere on the hero art pulls the tiles apart
    const zone = host.parentElement ?? host;
    let hoverTarget = 0;
    let hover = 0;
    const onEnter = () => (hoverTarget = 1);
    const onLeave = () => (hoverTarget = 0);
    zone.addEventListener("pointerenter", onEnter);
    zone.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(host);

    const smooth = (a: number, b: number, x: number) => {
      const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
      return t * t * (3 - 2 * t);
    };

    let raf = 0;
    const update = (ms: number) => {
      raf = requestAnimationFrame(update);
      if (!visible) return;
      const t = ms * 0.001;
      time.value = t;
      hover += (hoverTarget - hover) * 0.06;

      // apart, hold, back together, hold
      const p = (t % CYCLE) / CYCLE;
      const cycle = smooth(0.05, 0.35, p) * (1 - smooth(0.6, 0.9, p));
      const e = Math.max(cycle * 0.8, hover);

      group.rotation.y = Math.sin(t * 0.35) * 0.6;
      group.rotation.x = -0.32 + Math.sin(t * 0.23) * 0.12;
      group.position.y = Math.sin(t * 0.8) * 0.05;

      for (const tile of tiles) {
        const out = SCALE * (1 + e * 0.55);
        tile.node.position.set(tile.dir[0] * out, tile.dir[1] * out, tile.z * e);
        tile.node.rotation.set(tile.dir[1] * e * 0.35, -tile.dir[0] * e * 0.35, Math.PI / 4);
        tile.plates.forEach((m, i) => {
          m.position.z = (i - (PLATES - 1) / 2) * 0.055 * (1 + e * 2.6);
        });
      }
      for (const { mesh, dir, radius } of panels) {
        const r = radius * (1 + e * 0.22);
        mesh.position.set(dir.x * r, dir.y * r, dir.z * r);
      }

      renderer.render({ scene, camera });
    };
    raf = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      zone.removeEventListener("pointerenter", onEnter);
      zone.removeEventListener("pointerleave", onLeave);
      if (gl.canvas.parentNode === host) host.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (fallback) fallback.style.display = "";
    };
  }, []);

  return (
    <div ref={hostRef} className={`relative ${className}`} aria-hidden>
      <div className="absolute inset-[26%] animate-pulse-soft rounded-full bg-violet/20 blur-3xl" />
      <span ref={fallbackRef} className="absolute inset-0 grid place-items-center">
        <LogoMark size={96} />
      </span>
    </div>
  );
}
