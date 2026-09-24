import "./globals.css";
import CloudSyncProvider from "@/components/CloudSyncProvider";

export const metadata = {
  title: "사이버 마음 상담소 | H.E.A.R.T 프로젝트",
  description: "사이버폭력 피해 친구의 이야기를 듣고 안전한 응대를 연습하는 교육용 앱",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body><CloudSyncProvider>{children}</CloudSyncProvider></body>
    </html>
  );
}
