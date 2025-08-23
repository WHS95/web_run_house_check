import { FormLayout } from "@/components/layout/FormLayout";
import dynamic from "next/dynamic";

// 계산기 로직을 포함한 클라이언트 컴포넌트를 동적 로딩
const PaceCalculatorClient = dynamic(
  () => import("@/components/calculator/PaceCalculatorClient"),
  {
    ssr: false,
    loading: () => (
      <div className='px-4 mx-auto space-y-6'>
        <div className='flex p-1 space-x-1 rounded-lg border'>
          <div className='flex-1 h-10 bg-gray-700 rounded-md animate-pulse' />
          <div className='flex-1 h-10 bg-gray-700 rounded-md animate-pulse' />
          <div className='flex-1 h-10 bg-gray-700 rounded-md animate-pulse' />
        </div>
        <div className='space-y-4'>
          <div className='h-16 bg-gray-700 rounded-md animate-pulse' />
          <div className='h-24 bg-gray-700 rounded-md animate-pulse' />
          <div className='h-12 bg-gray-700 rounded-md animate-pulse' />
        </div>
      </div>
    ),
  }
);

export default function PaceCalculatorPage() {
  return (
    <FormLayout title='페이스 계산기'>
      <PaceCalculatorClient />
    </FormLayout>
  );
}
