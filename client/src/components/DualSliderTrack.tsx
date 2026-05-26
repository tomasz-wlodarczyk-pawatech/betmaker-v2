import { useCallback, useEffect, useRef } from "react";

interface DualSliderTrackProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  label: string;
}

export function DualSliderTrack({
  min,
  max,
  step,
  value,
  onChange,
  label,
}: DualSliderTrackProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<"min" | "max" | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;
  const range = max - min;
  const toPercent = (v: number) => ((v - min) / range) * 100;
  const startPercent = toPercent(value[0]);
  const endPercent = toPercent(value[1]);

  const snap = useCallback(
    (raw: number) => {
      const stepped = Math.round((raw - min) / step) * step + min;
      const decimals = step < 1 ? 1 : 0;
      const factor = Math.pow(10, decimals);
      return Math.round(stepped * factor) / factor;
    },
    [min, step],
  );

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const node = trackRef.current;
      if (!node) return min;
      const rect = node.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const clamped = Math.min(1, Math.max(0, ratio));
      return snap(min + clamped * range);
    },
    [min, range, snap],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const thumb = draggingRef.current;
      if (!thumb) return;
      const next = valueFromClientX(e.clientX);
      const [v0, v1] = valueRef.current;
      if (thumb === "min") {
        if (next === v0) return;
        onChangeRef.current([Math.min(next, v1), v1]);
      } else {
        if (next === v1) return;
        onChangeRef.current([v0, Math.max(next, v0)]);
      }
    };
    const onUp = () => {
      draggingRef.current = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [valueFromClientX]);

  const startDrag = (thumb: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = thumb;
    document.body.style.userSelect = "none";
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleTrackPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).classList.contains("odds-range-thumb")) {
      return;
    }
    const next = valueFromClientX(e.clientX);
    const [v0, v1] = valueRef.current;
    const closerToMin = Math.abs(next - v0) <= Math.abs(next - v1);
    const thumb: "min" | "max" = closerToMin ? "min" : "max";
    if (thumb === "min") {
      onChangeRef.current([Math.min(next, v1), v1]);
    } else {
      onChangeRef.current([v0, Math.max(next, v0)]);
    }
    draggingRef.current = thumb;
    document.body.style.userSelect = "none";
  };

  return (
    <div
      ref={trackRef}
      className="odds-range-track"
      onPointerDown={handleTrackPointerDown}
      style={
        {
          "--range-start": `${startPercent}%`,
          "--range-end": `${endPercent}%`,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        className="odds-range-thumb"
        aria-label={`${label} minimum`}
        aria-valuemin={min}
        aria-valuemax={value[1]}
        aria-valuenow={value[0]}
        onPointerDown={startDrag("min")}
        style={{ left: `${startPercent}%` }}
      />
      <button
        type="button"
        className="odds-range-thumb"
        aria-label={`${label} maximum`}
        aria-valuemin={value[0]}
        aria-valuemax={max}
        aria-valuenow={value[1]}
        onPointerDown={startDrag("max")}
        style={{ left: `${endPercent}%` }}
      />
    </div>
  );
}
