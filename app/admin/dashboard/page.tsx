"use client";

// import Header from "@/components/header"
// import WeatherCard from "@/components/weather-card"
// import TabNavigation from "@/components/tab-navigation"
import DeviceGrid from "@/components/organisms/device-grid";
// import BottomNavigation from "@/components/organisms/bottom-navigation"

export default function SmartHomeDashboard() {
  return (
    <div className='scroll-area-bottom min-h-screen bg-rh-bg-primary'>
      <div className='mx-auto max-w-sm min-h-screen bg-rh-bg-surface'>
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
