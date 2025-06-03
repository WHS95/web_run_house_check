"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // 기본 설치 프롬프트 방지
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 설치 프롬프트 표시
    await deferredPrompt.prompt();

    // 사용자 선택 결과 확인
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("사용자가 앱 설치를 수락했습니다");
    } else {
      console.log("사용자가 앱 설치를 거부했습니다");
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) return null;

  return (
    <div className='fixed z-50 p-4 text-white bg-blue-600 rounded-lg shadow-lg bottom-4 left-4 right-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='font-semibold'>런하우스 앱 설치</h3>
          <p className='text-sm opacity-90'>
            홈 화면에 추가하여 더 빠르게 접근하세요!
          </p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setShowInstallButton(false)}
            className='px-3 py-1 text-sm bg-blue-700 rounded hover:bg-blue-800'
          >
            나중에
          </button>
          <button
            onClick={handleInstallClick}
            className='px-3 py-1 text-sm text-blue-600 bg-white rounded hover:bg-gray-100'
          >
            설치
          </button>
        </div>
      </div>
    </div>
  );
}
