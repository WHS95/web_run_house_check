"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function FormLayout({ title, children }: FormLayoutProps) {
  const router = useRouter();

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-900'>
      {/* Header */}
      <div className='fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b'>
        <div className='flex items-center justify-between p-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.back()}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            뒤로
          </Button>
          <h1 className='text-lg font-semibold'>{title}</h1>
          <div className='w-16' /> {/* Spacer for center alignment */}
        </div>
      </div>

      {/* Content */}
      <div className='pt-20 px-4 pb-8'>
        <div className='max-w-md mx-auto'>
          <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
