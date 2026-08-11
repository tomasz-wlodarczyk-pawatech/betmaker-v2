import { useCallback, useEffect, useMemo, useRef } from "react";
import { createLinearScale, type SliderScale } from "@/lib/oddsScale";

interface DualSliderTrackProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  label: string;
  /**
   * Position mapping for the track. Defaults to an even spread across
   * [min, max]; pass a warped one (e.g. `createOddsScale`) when a linear track
   * would squash the interesting values into a few pixels.
   */
  scale?: SliderScale;
}

export function DualSliderTrack({
  min,
  max,
  step,
  value,
  onChange,
  label,
  scale: scaleProp,
}: DualSliderTrackProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<"min" | "max" | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;
  const scale = useMemo(
    () => scaleProp ?? createLinearScale(min, max, step),
    [scaleProp, min, max, step],
  );
  const startPercent = scale.toPosition(value[0]) * 100;
  const endPercent = scale.toPosition(value[1]) * 100;

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const node = trackRef.current;
      if (!node) return min;
      const rect = node.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return scale.fromPosition(ratio);
    },
    [min, scale],
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
