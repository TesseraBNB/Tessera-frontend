"use client";

// Liquid-metal pill button, adapted from the v0 "LiquidMetalButton" component to
// @paper-design/shaders 0.0.81 (ShaderMount.dispose, the full uniform set, the
// full-fill shape) and to this site: width follows the label, it can render as a
// link or a submit button, labels are legible on the dark pill, and there is a
// violet "primary" and a chrome "ghost" variant.

import Link from "next/link";
import { liquidMetalFragmentShader, ShaderFitOptions, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

type Variant = "primary" | "ghost";
type Size = "md" | "sm";

interface LiquidMetalButtonProps {
  label?: string;
  /** Icon after the label (before it with iconStart); the only content in icon mode. */
  icon?: ReactNode;
  iconStart?: boolean;
  viewMode?: "text" | "icon";
  variant?: Variant;
  size?: Size;
  /** Render as a link instead of a button. */
  href?: string;
  external?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  className?: string;
}

const HEIGHT: Record<Size, number> = { md: 46, sm: 38 };

const PILL: Record<Variant, { background: string; color: string; tint: [number, number, number, number] }> = {
  primary: {
    background: "linear-gradient(180deg, #a35bff 0%, #6a24d9 55%, #3d1293 100%)",
    color: "#ffffff",
    tint: [0.612, 0.263, 0.996, 0.45], // violet, colour-burned into the metal
  },
  ghost: {
    background: "linear-gradient(180deg, #24203a 0%, #07060d 100%)",
    color: "#e6e3f3",
    tint: [1, 1, 1, 0], // plain chrome
  },
};

const SHADOW = {
  rest: "0 0 0 1px rgba(0,0,0,0.3), 0 36px 14px rgba(0,0,0,0.02), 0 20px 12px rgba(0,0,0,0.08), 0 9px 9px rgba(0,0,0,0.12), 0 2px 5px rgba(0,0,0,0.15)",
  hover: "0 0 0 1px rgba(0,0,0,0.4), 0 12px 6px rgba(0,0,0,0.05), 0 8px 5px rgba(0,0,0,0.1), 0 4px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.2)",
  pressed: "0 0 0 1px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)",
};

const SPEED = { rest: 0.6, hover: 1, click: 2.4 };

export function LiquidMetalButton({
  label = "Get Started",
  icon,
  iconStart = false,
  viewMode = "text",
  variant = "ghost",
  size = "md",
  href,
  external = false,
  type = "button",
  disabled = false,
  onClick,
  className = "",
}: LiquidMetalButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const shaderRef = useRef<HTMLSpanElement>(null);
  const mount = useRef<ShaderMount | null>(null);
  const hoveredRef = useRef(false);
  const rippleId = useRef(0);
  const pill = PILL[variant];

  useEffect(() => {
    const el = shaderRef.current;
    if (!el) return;
    try {
      mount.current = new ShaderMount(
        el,
        liquidMetalFragmentShader,
        {
          u_colorBack: [0, 0, 0, 0],
          u_colorTint: pill.tint,
          u_repetition: 4,
          u_softness: 0.5,
          u_shiftRed: 0.3,
          u_shiftBlue: 0.3,
          u_distortion: 0,
          u_contour: 0,
          u_angle: 45,
          u_shape: 0, // fill the whole canvas; the pill is cut by CSS
          u_isImage: false,
          u_fit: ShaderFitOptions.none,
          u_scale: 1,
          u_rotation: 0,
          u_offsetX: 0.1,
          u_offsetY: -0.1,
          u_originX: 0.5,
          u_originY: 0.5,
          u_worldWidth: 0,
          u_worldHeight: 0,
        },
        undefined,
        SPEED.rest,
      );
    } catch {
      /* no WebGL: the flat pill still works */
    }
    return () => {
      mount.current?.dispose();
      mount.current = null;
    };
  }, [pill.tint]);

  const enter = () => {
    hoveredRef.current = true;
    setHovered(true);
    mount.current?.setSpeed(SPEED.hover);
  };
  const leave = () => {
    hoveredRef.current = false;
    setHovered(false);
    setPressed(false);
    mount.current?.setSpeed(SPEED.rest);
  };
  const click = (e: MouseEvent<HTMLElement>) => {
    if (disabled) return;
    mount.current?.setSpeed(SPEED.click);
    setTimeout(() => mount.current?.setSpeed(hoveredRef.current ? SPEED.hover : SPEED.rest), 300);
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId.current++ };
    setRipples((r) => [...r, ripple]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== ripple.id)), 600);
    onClick?.(e);
  };

  const h = HEIGHT[size];
  const iconOnly = viewMode === "icon";
  const ease = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  const press = pressed ? "translateY(1px) scale(0.98)" : "none";
  const glyph = icon ?? (iconOnly ? <Sparkles size={16} /> : null);

  const content = (
    <>
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: pressed ? SHADOW.pressed : hovered ? SHADOW.hover : SHADOW.rest, transition: "box-shadow 0.15s ease" }}
      />
      <span
        aria-hidden
        ref={shaderRef}
        className="liquid-metal absolute inset-0 overflow-hidden rounded-full bg-[#8a8796]"
        style={{ transform: press, transition: `transform 0.8s ${ease}` }}
      />
      <span
        aria-hidden
        className="absolute inset-[2px] rounded-full"
        style={{
          background: pill.background,
          transform: press,
          boxShadow: pressed ? "inset 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.3)" : "inset 0 1px 0 rgba(255,255,255,0.12)",
          transition: `transform 0.8s ${ease}, box-shadow 0.15s ease`,
        }}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        {ripples.map((r) => (
          <span
            key={r.id}
            className="absolute h-5 w-5 rounded-full"
            style={{
              left: r.x,
              top: r.y,
              background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)",
              animation: "lm-ripple 0.6s ease-out",
            }}
          />
        ))}
      </span>
      <span
        className={`relative z-10 inline-flex items-center gap-2 whitespace-nowrap font-semibold ${size === "sm" ? "text-[13px]" : "text-[14px]"}`}
        style={{ color: pill.color, textShadow: "0 1px 2px rgba(0,0,0,0.5)", transform: press, transition: `transform 0.8s ${ease}` }}
      >
        {iconOnly ? (
          glyph
        ) : (
          <>
            {iconStart && glyph}
            {label}
            {!iconStart && glyph}
          </>
        )}
      </span>
    </>
  );

  const props = {
    className: `relative inline-flex shrink-0 select-none items-center justify-center rounded-full ${
      iconOnly ? "" : size === "sm" ? "px-4" : "px-6"
    } ${disabled ? "pointer-events-none opacity-45" : "cursor-pointer"} ${className}`,
    style: { height: h, minWidth: iconOnly ? h : undefined },
    "aria-label": iconOnly ? label : undefined,
    onClick: click,
    onPointerEnter: enter,
    onPointerLeave: leave,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
  };

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} {...props}>
      {content}
    </button>
  );
}
