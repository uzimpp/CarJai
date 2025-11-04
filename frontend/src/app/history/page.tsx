'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/hooks/useUserAuth';
import { apiCall } from '@/lib/apiCall';

interface RecentView {
  rvid: number;
  user_id: number;
  car_id: number;
  viewed_at: string;
  year: number;
  mileage: number;
  price: number;
  province: string;
  condition_rating: number;
  color: string;
  status: string;
  brand_name: string;
  model_name: string;
  seller_display_name: string;
}

interface RecentViewsResponse {
  success: boolean;
  data: RecentView[];
  message: string;
}

export default function HistoryPage() {
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useUserAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchRecentViews();
    }
  }, [user, authLoading, router]);

  const fetchRecentViews = async () => {
    try {
      setLoading(true);
      const response = await apiCall<RecentViewsResponse>('/api/recent-views', {
        method: 'GET',
      });

      if (response.success) {
        setRecentViews(response.data);
      } else {
        setError(response.message || 'Failed to fetch viewing history');
      }
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('not authenticated')) {
        setError('Please sign in to view your viewing history.');
        return;
      }
      setError('Failed to fetch viewing history');
      // Use warn to avoid noisy stack traces in console
      console.warn('Error fetching recent views:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCarClick = (carId: number) => {
    router.push(`/car/${carId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRecentViews}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Viewing History</h1>
          <p className="text-gray-600">Cars you&apos;ve recently viewed</p>
        </div>

        {recentViews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No viewing history</h3>
            <p className="text-gray-500 mb-6">Start browsing cars to see your viewing history here.</p>
            <button
              onClick={() => router.push('/browse')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Cars
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentViews.map((view) => (
              <div
                key={view.rvid}
                onClick={() => handleCarClick(view.car_id)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {view.brand_name} {view.model_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Viewed {formatDate(view.viewed_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      view.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {view.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Year:</span>
                      <span className="text-sm font-medium">{view.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mileage:</span>
                      <span className="text-sm font-medium">{view.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Color:</span>
                      <span className="text-sm font-medium">{view.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Province:</span>
                      <span className="text-sm font-medium">{view.province}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Condition:</span>
                      <span className="text-sm font-medium">{view.condition_rating}/10</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPrice(view.price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          by {view.seller_display_name}
                        </p>
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}