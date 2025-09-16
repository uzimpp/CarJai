"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function NotFoundContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { code, title, message } = useMemo(() => {
    const codeParam = searchParams.get("code");
    const parsedCode = codeParam ? parseInt(codeParam, 10) : 404;
    const safeCode = Number.isFinite(parsedCode) ? parsedCode : 404;

    const titleParam = searchParams.get("title");
    const messageParam = searchParams.get("message");

    return {
      code: safeCode,
      title:
        titleParam || (safeCode === 403 ? "ปฏิเสธการเข้าถึง" : "ไม่พบหน้านี้"),
      message:
        messageParam ||
        (safeCode === 403
          ? "คุณไม่มีสิทธิ์เข้าถึงทรัพยากรนี้"
          : "ไม่พบหน้าที่คุณต้องการ หรืออาจถูกย้ายไปแล้ว"),
    };
  }, [searchParams]);

  const accent = useMemo(() => {
    // ใช้สีตามธีมของเว็บไซต์ (แดง/ดำ/เทา) ให้ลุคสอดคล้องทั้งระบบ
    return {
      ring: "ring-2 ring-red",
      text: "text-red",
      btn: "bg-red hover:bg-maroon",
      neutralText: "text-grey",
      headingText: "text-black",
    } as const;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-(--space-m)">
      <div className="max-w-lg w-full text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-white ${accent.ring}`}
        >
          <span className={`${accent.text} text-2xl font-bold`}>{code}</span>
        </div>
        <h1 className={`text-3xl font-bold ${accent.headingText} mb-3`}>
          {title}
        </h1>
        <p className={`${accent.neutralText} mb-8`}>{message}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-full bg-grey hover:bg-black text-white font-medium py-2.5 px-4 rounded-md transition"
          >
            กลับหน้าแรก
          </button>
          <button
            onClick={() => router.push("/admin/login")}
            className={`w-full ${accent.btn} text-white font-medium py-2.5 px-4 rounded-md transition`}
          >
            ไปยังหน้าเข้าสู่ระบบผู้ดูแล
          </button>
        </div>

        <div className="mt-6 text-sm text-grey">รหัสข้อผิดพลาด: {code}</div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          กำลังโหลด...
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  );
}
