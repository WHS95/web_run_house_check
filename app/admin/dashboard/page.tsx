"use client";

// import Header from "@/components/header"
// import WeatherCard from "@/components/weather-card"
// import TabNavigation from "@/components/tab-navigation"
import DeviceGrid from "@/components/organisms/device-grid";
// import BottomNavigation from "@/components/organisms/bottom-navigation"

export default function SmartHomeDashboard() {
  return (
    <div className='pb-20 min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-sm min-h-screen bg-white'>
        <div className='p-6 space-y-6'>
          {/* <Header />
          <WeatherCard />
          <TabNavigation /> */}
          <DeviceGrid />
        </div>
        {/* <BottomNavigation /> */}
      </div>
    </div>
  );
}
