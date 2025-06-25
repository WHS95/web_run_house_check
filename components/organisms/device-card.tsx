"use client";

import type { LucideIcon } from "lucide-react";

interface Device {
  id: number;
  name: string;
  count: string;
  icon: LucideIcon;
  isActive: boolean;
  isDark: boolean;
}

interface DeviceCardProps {
  device: Device;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const { name, count, icon: Icon, isActive, isDark } = device;

  return (
    <div
      className={`rounded-3xl p-6 transition-all cursor-pointer hover:scale-105 ${
        isDark
          ? "text-white bg-gray-900"
          : "text-gray-800 bg-gray-100 hover:bg-gray-200"
      }`}
    >
      <div className='flex justify-between items-start mb-8'>
        <div
          className={`p-3 rounded-full ${
            isDark ? "text-gray-900 bg-white" : "text-gray-800 bg-white"
          }`}
        >
          <Icon className='w-6 h-6' />
        </div>
        <div
          className={`w-4 h-4 rounded-full ${
            isActive ? "bg-blue-500" : isDark ? "bg-gray-600" : "bg-gray-400"
          }`}
        ></div>
      </div>

      <div>
        <h3 className='mb-1 text-lg font-semibold'>{name}</h3>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {count}
        </p>
      </div>
    </div>
  );
}
