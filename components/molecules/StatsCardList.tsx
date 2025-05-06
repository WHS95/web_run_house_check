import { ReactNode } from "react";
import StatCard from "@/components/atoms/StatCard";

interface StatCardItem {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  bgColor: string;
}

interface StatsCardListProps {
  items: StatCardItem[];
}

const StatsCardList = ({ items }: StatsCardListProps) => {
  return (
    <div className='bg-gray-800 rounded-lg mx-4 mt-4 p-4 shadow'>
      {items.map((item, index) => (
        <StatCard
          key={index}
          icon={item.icon}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          bgColor={item.bgColor}
        />
      ))}
    </div>
  );
};

export default StatsCardList;
