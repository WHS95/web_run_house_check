import { FormLayout } from "@/components/layout/FormLayout";
import dynamic from "next/dynamic";

const HeartRateCalculatorClient = dynamic(
  () => import("@/components/calculator/HeartRateCalculatorClient"),
  { 
    ssr: false, 
    loading: () => <div className='h-96 bg-gray-700 rounded animate-pulse' /> 
  }
);

export default function HeartRateCalculatorPage() {
  return (
    <FormLayout title='심박수 존 계산기'>
      <HeartRateCalculatorClient />
    </FormLayout>
  );
}