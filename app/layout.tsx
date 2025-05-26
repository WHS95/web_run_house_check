import "./styles/globals.css";
import { ReactNode } from "react";
import { StagewiseToolbar } from "@stagewise/toolbar-next";

export const metadata = {
  title: "RunHouse",
  description: "런하우스 - 러닝 커뮤니티",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ko'>
      <body>
        <StagewiseToolbar
          config={{
            plugins: [], // 필요한 경우 여기에 사용자 정의 플러그인을 추가할 수 있습니다.
          }}
        />
        <div className='h-screen overflow-hidden'>{children}</div>
      </body>
    </html>
  );
}
