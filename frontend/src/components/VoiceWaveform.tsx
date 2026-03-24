import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface VoiceWaveformProps {
  isRecording: boolean;
  className?: string;
}

export default function VoiceWaveform({ isRecording, className }: VoiceWaveformProps) {
  const bars = Array.from({ length: 5 });

  return (
    <div className={cn("flex items-center gap-1 h-6", className)}>
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-primary rounded-full"
          animate={
            isRecording
              ? {
                  height: ["20%", "100%", "40%", "80%", "20%"],
                }
              : { height: "20%" }
          }
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}
