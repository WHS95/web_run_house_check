import React, { useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleCheck, CircleSlash, CircleEllipsis } from "lucide-react";

export type NotificationType = "success" | "error" | "loading";

interface PopupNotificationProps {
  isVisible: boolean;
  message: string;
  duration: number;
  onClose: () => void;
  type: NotificationType;
}

// ⚡ 메모이제이션으로 성능 최적화
const PopupNotification = memo<PopupNotificationProps>(
  ({ isVisible, message, duration, onClose, type }) => {
    // ⚡ useCallback으로 함수 메모이제이션
    const handleAutoClose = useCallback(() => {
      onClose();
    }, [onClose]);

    useEffect(() => {
      if (isVisible) {
        const timer = setTimeout(handleAutoClose, duration);
        return () => clearTimeout(timer);
      }
    }, [isVisible, duration, handleAutoClose]);

    // ⚡ 아이콘 설정을 상수로 메모이제이션
    const iconConfig = (() => {
      switch (type) {
        case "success":
          return { color: "text-blue-500", Component: CircleCheck };
        case "error":
          return { color: "text-red-500", Component: CircleSlash };
        case "loading":
          return {
            color: "text-yellow-500",
            Component: CircleEllipsis,
          };
        default:
          return { color: "text-red-500", Component: CircleSlash };
      }
    })();

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-basic-black bg-opacity-30'
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
                <iconConfig.Component size={95} className={iconConfig.color} />
              </motion.div>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className={`px-4 mt-6 text-xl font-semibold ${iconConfig.color} text-center`}
              >
                {message}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

PopupNotification.displayName = "PopupNotification";

export default PopupNotification;
