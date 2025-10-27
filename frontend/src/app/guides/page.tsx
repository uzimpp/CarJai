'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, ShoppingCart, User, Camera, CheckCircle, Search, Phone, Sparkles, Shield } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  visual: string;
  badge?: string;
  tip?: string;
  important?: string;
}

interface StepCardProps {
  step: Step;
  index: number;
}

export default function CarJaiGuides() {
  const [activeTab, setActiveTab] = useState('seller');
  const router = useRouter();

  const sellerSteps: Step[] = [
    {
      id: 1,
      title: 'Create Your Account',
      icon: User,
      description: 'Sign up with your email and password. Once you\'re in, you can start listing your car right away!',
      visual: '📝'
    },
    {
      id: 2,
      title: 'Complete Your Profile',
      icon: User,
      description: 'Add your display name and contact info so buyers can reach you. You can also add a short bio and location.',
      visual: '👤'
    },
    {
      id: 3,
      title: 'Snap a Photo of Your Registration',
      icon: Sparkles,
      description: 'Take a clear picture of your car\'s registration book. Our smart system will automatically fill in the details for you!',
      badge: 'OPTIONAL',
      tip: 'This saves you tons of typing - but you can skip it and enter details manually',
      visual: '📸'
    },
    {
      id: 4,
      title: 'Add Inspection Report',
      icon: Shield,
      description: 'Have an inspection QR code? Paste the link and we\'ll pull in the official inspection data. This builds trust with buyers!',
      badge: 'OPTIONAL',
      visual: '✅'
    },
    {
      id: 5,
      title: 'Tell Us About Your Car',
      icon: Car,
      description: 'Fill in the details - price, year, mileage, color, and condition. Don\'t worry, most fields are optional!',
      visual: '🚗'
    },
    {
      id: 6,
      title: 'Upload Photos',
      icon: Camera,
      description: 'Add at least 5 great photos of your car. Show the exterior, interior, engine, and any special features. More photos = more interest!',
      important: 'Need at least 5 photos, max 12 photos',
      visual: '📷'
    },
    {
      id: 7,
      title: 'Publish Your Listing',
      icon: CheckCircle,
      description: 'Hit publish and your car goes live! Buyers can now find it, see your photos, and contact you.',
      visual: '🚀'
    }
  ];

  const sellerManagement = [
    {
      title: 'Update Anytime',
      description: 'Change the price, add details, or swap photos whenever you want',
      icon: '✏️'
    },
    {
      title: 'Mark as Sold',
      description: 'When your car sells, just mark it sold. It stays in your history but disappears from search',
      icon: '✨'
    },
    {
      title: 'Track Your Listings',
      description: 'See all your cars in one place - drafts, active, and sold',
      icon: '📊'
    }
  ];

  const buyerSteps: Step[] = [
    {
      id: 1,
      title: 'Search for Your Dream Car',
      icon: Search,
      description: 'Use filters to narrow down by price, location, year, body type, and more. Find exactly what you\'re looking for!',
      visual: '🔍'
    },
    {
      id: 2,
      title: 'Browse & Compare',
      icon: Car,
      description: 'Check out photos, specs, mileage, and condition ratings. See inspection results if available. Take your time!',
      visual: '👀'
    },
    {
      id: 3,
      title: 'Contact the Seller',
      icon: Phone,
      description: 'Found the one? Click to see seller contact info. Reach out to ask questions, schedule a viewing, or make an offer.',
      visual: '💬'
    },
    {
      id: 4,
      title: 'Meet & Inspect',
      icon: CheckCircle,
      description: 'Arrange a meeting, check the car in person, take it for a test drive, and negotiate the final price.',
      visual: '🤝'
    }
  ];

  const StepCard: React.FC<StepCardProps> = ({ step, index }) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 mb-2 border border-gray-100">
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-red-900 to-red-800 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
              {index + 1}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
              {step.badge && (
                <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                  {step.badge}
                </span>
              )}
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-3">{step.description}</p>
            
            {step.tip && (
              <div className="bg-red-50 border-l-4 border-red-800 p-3 rounded-r mb-3">
                <p className="text-sm text-red-900">💡 <strong>Tip:</strong> {step.tip}</p>
              </div>
            )}
            
            {step.important && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r">
                <p className="text-sm text-orange-900">⚠️ <strong>Important:</strong> {step.important}</p>
              </div>
            )}
          </div>
          
          <div className="text-4xl hidden sm:block">{step.visual}</div>
        </div>
      </div>
    );
  };

  const handleUnderstandClick = () => {
    router.push('/');
  };

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Header matching CarJai style */}
      <div className="bg-gradient-to-r from-red-900 to-red-800 text-white py-16 px-8 rounded-3xl shadow-lg max-w-6xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h1>
          <p className="text-xl text-red-100">
            Simple steps to buy or sell your car
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8">
        {/* Tab Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('seller')}
            className={`flex-1 py-5 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center ${
              activeTab === 'seller'
                ? 'bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
            }`}
          >
            <Car className="w-6 h-6 mr-2" />
            Seller
          </button>
          <button
            onClick={() => setActiveTab('buyer')}
            className={`flex-1 py-5 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center ${
              activeTab === 'buyer'
                ? 'bg-gradient-to-r from-green-700 to-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
            }`}
          >
            <ShoppingCart className="w-6 h-6 mr-2" />
            Buyer
          </button>
        </div>

        {/* Seller Guide */}
        {activeTab === 'seller' && (
          <div className="pb-12">
            <div className="bg-gradient-to-r from-red-900 to-red-800 text-white rounded-2xl p-8 mb-6 shadow-md">
              <h2 className="text-3xl font-bold mb-3">Selling Your Car</h2>
              <p className="text-red-100 text-lg">
                List your car and get connected with serious buyers across the country!
              </p>
            </div>

            {sellerSteps.map((step, idx) => (
              <StepCard key={step.id} step={step} index={idx} />
            ))}

            <div className="bg-white rounded-2xl shadow-sm p-8 mt-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">After You Publish</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {sellerManagement.map((item, idx) => (
                  <div key={idx} className="text-center p-5 bg-gray-50 rounded-xl">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mt-6">
              <h3 className="text-xl font-bold text-red-900 mb-4">📸 Photo Tips for Best Results</h3>
              <div className="grid md:grid-cols-2 gap-4 text-red-900">
                <div className="flex items-start gap-3">
                  <span className="text-red-800 font-bold">✓</span>
                  <span>Take photos in good lighting (daytime works best)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-800 font-bold">✓</span>
                  <span>Clean your car before photographing</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-800 font-bold">✓</span>
                  <span>Show all angles - front, back, sides, interior</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-800 font-bold">✓</span>
                  <span>Highlight any special features or upgrades</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button 
                onClick={handleUnderstandClick}
                className="bg-gradient-to-r from-red-900 to-red-800 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all hover:scale-105"
              >
                I Understand It
              </button>
            </div>
          </div>
        )}

        {/* Buyer Guide */}
        {activeTab === 'buyer' && (
          <div className="pb-12">
            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl p-8 mb-6 shadow-md">
              <h2 className="text-3xl font-bold mb-3">Finding Your Perfect Car</h2>
              <p className="text-green-100 text-lg">
                Browse thousands of verified listings. Connect directly with sellers. No middleman fees!
              </p>
            </div>

            {buyerSteps.map((step, idx) => (
              <StepCard key={step.id} step={step} index={idx} />
            ))}

            <div className="bg-white rounded-2xl shadow-sm p-8 mt-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">🔍 Smart Search Tips</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                  <span className="text-3xl">💰</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Set Your Budget</h4>
                    <p className="text-sm text-gray-600">Use min/max price filters to see only what you can afford</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                  <span className="text-3xl">📍</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Filter by Location</h4>
                    <p className="text-sm text-gray-600">Find cars near you to make viewing easier</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                  <span className="text-3xl">⚙️</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Know What You Want</h4>
                    <p className="text-sm text-gray-600">Filter by body type, fuel type, transmission - narrow it down!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 mt-6">
              <h3 className="text-xl font-bold text-green-900 mb-4">🛡️ Safety Tips</h3>
              <div className="space-y-3 text-green-900">
                <p className="flex items-start gap-3">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Always meet in a public place for the first viewing</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Bring someone with you if possible</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Check the car's VIN and registration documents</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Take it for a test drive before committing</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Consider getting a mechanic to inspect it</span>
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button 
                onClick={handleUnderstandClick}
                className="bg-gradient-to-r from-green-700 to-green-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all hover:scale-105"
              >
                I Understand It
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
