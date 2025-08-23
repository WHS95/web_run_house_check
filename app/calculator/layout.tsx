import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '러닝 계산기 | RunHouse',
  description: '페이스, 완주시간, 스플릿타임, 심박수존 계산기',
};

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}