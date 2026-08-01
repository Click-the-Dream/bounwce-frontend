import { useEffect, useState } from "react";

interface FlipUnitProps {
  value: string;
  label: string;
}

export default function FlipUnit({ value, label }: FlipUnitProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value === currentValue) return;

    setPreviousValue(currentValue);
    setCurrentValue(value);
    setIsFlipping(true);

    const timeout = setTimeout(() => {
      setIsFlipping(false);
    }, 450);

    return () => clearTimeout(timeout);
  }, [value, currentValue]);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-h-10.5 w-full flex-col items-center justify-center rounded-[5px] border-[0.46px] border-black/40 bg-white shadow-xs">
        {/* Number */}
        <div className="relative h-4.5 w-full" style={{ perspective: "400px" }}>
          {/* New/current value - stays underneath */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-bold leading-none text-black bg-white/80">
              {currentValue}
            </span>
          </div>

          {/* Old value - flips away */}
          {isFlipping && (
            <div
              key={`${label}-${currentValue}`}
              className="absolute inset-0 z-10 flex items-center justify-center animate-flip-out"
              style={{
                transformOrigin: "bottom center",
                backfaceVisibility: "hidden",
              }}
            >
              <span className="text-base font-bold leading-none text-black bg-white/80">
                {previousValue}
              </span>
            </div>
          )}
        </div>

        {/* Label */}
        <span className="mt-1 text-[9px] font-light leading-none tracking-wider text-black/60">
          {label}
        </span>
      </div>
    </div>
  );
}
