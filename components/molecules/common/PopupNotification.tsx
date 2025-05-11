import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleCheck, CircleSlash } from "lucide-react";

export type NotificationType = "success" | "error";

interface PopupNotificationProps {
  isVisible: boolean;
  message: string;
  duration: number;
  onClose: () => void;
  type: NotificationType;
}

const PopupNotification: React.FC<PopupNotificationProps> = ({
  isVisible,
  message,
  duration,
  onClose,
  type,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const iconColor = type === "success" ? "text-blue-500" : "text-red-500";
  const IconComponent = type === "success" ? CircleCheck : CircleSlash;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-30'
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className='flex flex-col items-center justify-center bg-white shadow-2xl rounded-xl w-72 h-72 md:w-80 md:h-80'
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 400,
                damping: 15,
              }}
            >
              <IconComponent size={95} className={iconColor} />
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className={`px-4 mt-6 text-xl font-semibold ${iconColor} text-center`}
            >
              {message}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PopupNotification;
