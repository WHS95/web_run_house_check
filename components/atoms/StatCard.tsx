import React, { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  bgColor: string;
  subtitle?: string;
}

export default function StatCard({
  icon,
  title,
  value,
  bgColor,
  subtitle,
}: StatCardProps) {
  return (
    <div className={`rounded-rh-lg p-4 shadow-md ${bgColor}`}>
      <div className='flex items-center mb-2'>
        <div className='flex-shrink-0 mr-3'>{icon}</div>
        <div>
          <h3 className='text-rh-text-primary font-medium'>{title}</h3>
          {subtitle && <p className='text-rh-text-secondary text-sm'>{subtitle}</p>}
        </div>
      </div>
      <div className='text-2xl font-bold text-rh-text-primary'>{value}</div>
    </div>
  );
}
