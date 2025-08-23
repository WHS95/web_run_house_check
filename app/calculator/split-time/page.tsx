import { FormLayout } from "@/components/layout/FormLayout";
import dynamic from "next/dynamic";

const SplitTimeCalculatorClient = dynamic(
  () => import("@/components/calculator/SplitTimeCalculatorClient"),
  { 
    ssr: false, 
    loading: () => <div className='h-96 bg-gray-700 rounded animate-pulse' /> 
  }
);

export default function SplitTimeCalculatorPage() {
  return (
    <FormLayout title='스플릿 타임 계산기'>
      <SplitTimeCalculatorClient />
    </FormLayout>
  );
}