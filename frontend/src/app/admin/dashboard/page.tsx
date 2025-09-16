"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminDashboard() {
  const router = useRouter();
  const {
    adminUser,
    adminSession,
    ipWhitelist,
    loading,
    isAuthenticated,
    logout,
  } = useAdminAuth();

  useEffect(() => {
    console.log("🔍 Admin dashboard - checking auth state:", {
      loading,
      isAuthenticated,
    });
    // Only redirect if we're done loading and definitely not authenticated
    if (!loading && isAuthenticated === false) {
      console.log("❌ Admin not authenticated, redirecting to login");
      router.push("/admin/login");
    } else if (!loading && isAuthenticated === true) {
      console.log("✅ Admin authenticated, showing dashboard");
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "หมดอายุแล้ว";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  };

  const isSessionExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return diff <= 30 * 60 * 1000; // 30 minutes
  };

  // Show loading while authentication is being checked
  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">กำลังตรวจสอบสิทธิ์...</div>
          <div className="text-sm text-gray-500">โปรดรอสักครู่</div>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen in useEffect)
  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              แดชบอร์ดผู้ดูแล CarJai
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                ยินดีต้อนรับ, {adminUser?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Session Information */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                ข้อมูลเซสชันปัจจุบัน
              </h2>
              {adminSession && (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      IP Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {adminSession.ip_address}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      เวลาที่สร้างเซสชัน
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(adminSession.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      หมดอายุเมื่อ
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(adminSession.expires_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      เวลาที่เหลือ
                    </dt>
                    <dd
                      className={`mt-1 text-sm font-medium ${
                        isSessionExpiringSoon(adminSession.expires_at)
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {getTimeRemaining(adminSession.expires_at)}
                      {isSessionExpiringSoon(adminSession.expires_at) && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          ใกล้หมดอายุ
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>

          {/* IP Whitelist Information */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                รายการ IP ที่อนุญาต ({ipWhitelist.length} รายการ)
              </h2>
              {ipWhitelist.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          คำอธิบาย
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          เพิ่มเมื่อ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ipWhitelist.map((ip) => (
                        <tr key={ip.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {ip.ip_address}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ip.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(ip.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">
                    ไม่มี IP ที่อนุญาตในระบบ
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Information */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                ข้อมูลผู้ดูแล
              </h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    ชื่อบัญชี
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {adminUser?.username}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    ชื่อผู้ใช้
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {adminUser?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    เข้าสู่ระบบล่าสุด
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {adminUser?.last_login_at
                      ? new Date(adminUser.last_login_at).toLocaleString()
                      : "ไม่มีข้อมูล"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    สร้างบัญชีเมื่อ
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {adminUser?.created_at
                      ? new Date(adminUser.created_at).toLocaleString()
                      : "ไม่มีข้อมูล"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
