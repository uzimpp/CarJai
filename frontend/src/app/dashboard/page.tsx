"use client";

import { useAuth } from "@/hooks/useUserAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                ยินดีต้อนรับสู่ CarJai
              </h1>
              <p className="text-gray-600">หน้าต่างส่วนตัวของคุณ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* User Info Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  ข้อมูลบัญชี
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      อีเมล
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      สมาชิกตั้งแต่
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString("th-TH")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  เมนูหลัก
                </h2>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-2 bg-maroon text-white rounded-lg hover:bg-red transition-colors">
                    ดูรถที่สนใจ
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    ประกาศขายรถ
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    ตั้งค่าบัญชี
                  </button>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleLogout}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
