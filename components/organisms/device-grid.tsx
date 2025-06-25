import DeviceCard from "@/components/organisms/device-card";
import { Lightbulb, Wind, Tv, Volume2 } from "lucide-react";

const devices = [
  {
    id: 1,
    name: "Smart Light",
    count: "4 Lamps",
    icon: Lightbulb,
    isActive: true,
    isDark: true,
  },
  {
    id: 2,
    name: "Smart AC",
    count: "2 Device",
    icon: Wind,
    isActive: false,
    isDark: false,
  },
  {
    id: 3,
    name: "Smart TV",
    count: "1 Device",
    icon: Tv,
    isActive: false,
    isDark: false,
  },
  {
    id: 4,
    name: "Smart Speaker",
    count: "2 Device",
    icon: Volume2,
    isActive: false,
    isDark: false,
  },
];

export default function DeviceGrid() {
  return (
    <div className='grid grid-cols-2 gap-4'>
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  );
}
