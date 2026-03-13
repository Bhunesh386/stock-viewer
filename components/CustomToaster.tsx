"use client";

import { useToaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import React from 'react';

export default function CustomToaster() {
  const { toasts, handlers } = useToaster();
  const { startPause, endPause } = handlers;

  return (
    <div
      onMouseEnter={startPause}
      onMouseLeave={endPause}
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          return (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: toast.visible ? 1 : 0, x: toast.visible ? 0 : 50, scale: toast.visible ? 1 : 0.9 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto flex flex-col bg-[#0f1117] border border-[#1e2433] text-white rounded shadow-xl overflow-hidden min-w-[300px]"
              {...toast.ariaProps}
            >
              <div className="p-3 text-sm font-mono flex items-center">
                {typeof toast.message === 'function' ? toast.message(toast) : toast.message as React.ReactNode}
              </div>
              <motion.div 
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (toast.duration || 3000) / 1000, ease: 'linear' }}
                className={`h-1 w-full origin-left ${toast.type === 'error' ? 'bg-[#ff4444]' : 'bg-[#00ff88]'}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
