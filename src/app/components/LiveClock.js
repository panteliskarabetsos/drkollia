"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function LiveClock({ className = "" }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <div className={className}>{format(now, "HH:mm")}</div>;
}
