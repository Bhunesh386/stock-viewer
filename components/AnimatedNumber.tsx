"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

export default function AnimatedNumber({ value, format, className = "" }: AnimatedNumberProps) {
  const prevValue = useRef(value);
  const [colorClass, setColorClass] = useState("text-inherit transition-colors duration-500");
  
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => {
    return format ? format(current) : current.toFixed(2);
  });

  useEffect(() => {
    spring.set(value);
    
    if (value > prevValue.current) {
      setColorClass("text-stockGreen transition-none");
      const timeout = setTimeout(() => setColorClass("text-inherit transition-colors duration-500"), 50);
      prevValue.current = value;
      return () => clearTimeout(timeout);
    } else if (value < prevValue.current) {
      setColorClass("text-stockRed transition-none");
      const timeout = setTimeout(() => setColorClass("text-inherit transition-colors duration-500"), 50);
      prevValue.current = value;
      return () => clearTimeout(timeout);
    }
    
    prevValue.current = value;
  }, [value, spring]);

  return <motion.span className={`${colorClass} ${className}`.trim()}>{display}</motion.span>;
}
