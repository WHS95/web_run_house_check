"use client";

import React from "react";
import DashboardStats from "@/components/organisms/DashboardStats";
import RecentAttendance from "@/components/organisms/RecentAttendance";

export default function AdminDashboard() {
  return (
    <main className='bg-gray-900 text-white p-6 overflow-y-auto'>
      <div className='max-w-7xl mx-auto'>
        <section className='mb-8'>
          <DashboardStats />
        </section>

        <section className='mb-8'>
          <RecentAttendance />
        </section>
      </div>
    </main>
  );
}
