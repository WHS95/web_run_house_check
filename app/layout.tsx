import "./styles/globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "RunHouse",
  description: "런하우스 - 러닝 커뮤니티",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ko'>
      <body>
        <div className='h-screen overflow-hidden'>{children}</div>
      </body>
    </html>
  );
}
