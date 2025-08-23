import { FormLayout } from "@/components/layout/FormLayout";
import dynamic from "next/dynamic";

// 계산기 로직을 포함한 클라이언트 컴포넌트를 동적 로딩
const PredictionCalculatorClient = dynamic(
  () => import("@/components/calculator/PredictionCalculatorClient"),
  {
    ssr: false,
    loading: () => (
      <div className='space-y-6'>
        <div className='p-4 text-sm rounded-lg bg-accent/50'>
          <div className='h-16 bg-gray-700 rounded animate-pulse' />
        </div>
        <div className='space-y-4'>
          <div className='h-16 bg-gray-700 rounded animate-pulse' />
          <div className='h-24 bg-gray-700 rounded animate-pulse' />
          <div className='h-16 bg-gray-700 rounded animate-pulse' />
          <div className='h-12 bg-gray-700 rounded animate-pulse' />
        </div>
      </div>
    ),
  }
);

export default function PredictionCalculatorPage() {
  return (
    <FormLayout title='완주 시간 예측기'>
      <PredictionCalculatorClient />
    </FormLayout>
  );
}
