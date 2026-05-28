"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";

export default function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isLate, setIsLate] = useState(false);

  useEffect(() => {
    const target = new Date(deadline).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsLate(true);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
      } else {
        setIsLate(false);
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    // Initial calculation to prevent hydration mismatch delay
    const difference = target - new Date().getTime();
    if (difference <= 0) {
      setIsLate(true);
      setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
    } else {
      setTimeLeft({
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((difference % (1000 * 60)) / 1000),
      });
    }

    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) return null; // Wait for client calculation

  if (isLate) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold text-xs uppercase tracking-widest border border-red-200">
        <AlertCircle className="w-3.5 h-3.5" />
        Late Delivery
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-orange-500" />
      <div className="flex items-center gap-1">
        {timeLeft.d > 0 && (
          <>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base text-foreground bg-white border border-border rounded-md px-1.5 min-w-[28px] text-center shadow-sm">
                {String(timeLeft.d).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">d</span>
            </div>
            <span className="font-bold text-muted-foreground/50 pb-3">:</span>
          </>
        )}
        <div className="flex flex-col items-center">
          <span className="font-bold text-base text-foreground bg-white border border-border rounded-md px-1.5 min-w-[28px] text-center shadow-sm">
            {String(timeLeft.h).padStart(2, "0")}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">h</span>
        </div>
        <span className="font-bold text-muted-foreground/50 pb-3">:</span>
        <div className="flex flex-col items-center">
          <span className="font-bold text-base text-foreground bg-white border border-border rounded-md px-1.5 min-w-[28px] text-center shadow-sm">
            {String(timeLeft.m).padStart(2, "0")}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">m</span>
        </div>
        <span className="font-bold text-muted-foreground/50 pb-3">:</span>
        <div className="flex flex-col items-center">
          <span className="font-bold text-base text-foreground bg-white border border-border rounded-md px-1.5 min-w-[28px] text-center shadow-sm">
            {String(timeLeft.s).padStart(2, "0")}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">s</span>
        </div>
      </div>
    </div>
  );
}
