import React from "react";
import StatCard from "@/components/atoms/StatCard";
import { StatsCardData } from "@/lib/dashboard-data";

interface StatCardListProps {
  cards: StatsCardData[];
}

export default function StatCardList({ cards }: StatCardListProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      {cards.map((card, index) => (
        <StatCard
          key={index}
          icon={card.icon}
          title={card.title}
          subtitle={card.subtitle}
          value={card.value}
          bgColor={card.bgColor}
        />
      ))}
    </div>
  );
}
