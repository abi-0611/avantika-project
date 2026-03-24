import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export default function Toast({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const tone =
    type === 'success'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
      : type === 'error'
        ? 'border-red-500/20 bg-red-500/10 text-red-200'
        : 'border-blue-500/20 bg-blue-500/10 text-blue-200';

  return (
    <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
      <AnimatePresence>
        {visible && message && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`pointer-events-auto max-w-sm rounded-2xl px-4 py-3 border ${tone} backdrop-blur-sm`}
          >
            <p className="text-xs font-semibold tracking-wide">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
