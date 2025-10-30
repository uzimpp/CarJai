'use client';

import React from 'react';
import Link from 'next/link';
import { Car, Search, Phone, ShoppingCart, Heart, MapPin, DollarSign, Shield } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  description: string;
  visual: string;
  tip?: string;
  important?: string;
}

interface StepCardProps {
  step: Step;
  index: number;
}

export default function BuyerGuides() {
  const buyerSteps: Step[] = [
    {
      id: 1,
      title: 'Create Your Buyer Account',
      icon: ShoppingCart,
      description: 'Sign up with your email and password. Set up your buyer profile to start browsing cars and save your favorites!',
      visual: '📝',
      tip: 'Complete your profile to build trust with sellers'
    },
    {
      id: 2,
      title: 'Search for Your Dream Car',
      icon: Search,
      description: 'Use our advanced filters to narrow down by price, location, year, body type, fuel type, and more. Find exactly what you&apos;re looking for!',
      visual: '🔍',
      tip: 'Save your search criteria to get notified of new listings'
    },
    {
      id: 3,
      title: 'Browse & Compare Listings',
      icon: Car,
      description: 'Check out photos, specs, mileage, and condition ratings. See inspection results if available. Compare multiple cars side by side.',
      visual: '👀',
      tip: 'Look for cars with inspection reports for added confidence'
    },
    {
      id: 4,
      title: 'Save Your Favorites',
      icon: Heart,
      description: 'Found cars you like? Save them to your favorites list. You can compare them later and track price changes.',
      visual: '❤️'
    },
    {
      id: 5,
      title: 'Contact the Seller',
      icon: Phone,
      description: 'Ready to learn more? Click to see seller contact info. Reach out to ask questions, request more photos, or schedule a viewing.',
      visual: '💬',
      important: 'Always communicate through verified contact methods'
    },
    {
      id: 6,
      title: 'Schedule a Viewing',
      icon: MapPin,
      description: 'Arrange a meeting in a safe, public location. Inspect the car thoroughly and take it for a test drive.',
      visual: '🤝',
      tip: 'Bring a knowledgeable friend or consider hiring a mechanic for inspection'
    },
    {
      id: 7,
      title: 'Negotiate & Purchase',
      icon: DollarSign,
      description: 'Negotiate the final price, arrange payment, and complete the paperwork. Congratulations on your new car!',
      visual: '🚗',
      important: 'Always verify ownership documents before payment'
    }
  ];

  const searchTips = [
    {
      title: 'Set Your Budget',
      description: 'Use min/max price filters to see only what you can afford. Don&apos;t forget to budget for insurance, registration, and maintenance.',
      icon: '💰'
    },
    {
      title: 'Filter by Location',
      description: 'Find cars near you to make viewing easier. Consider expanding your search radius for rare models.',
      icon: '📍'
    },
    {
      title: 'Know What You Want',
      description: 'Filter by body type, fuel type, transmission, and features. The more specific, the better your results.',
      icon: '⚙️'
    },
    {
      title: 'Check Inspection Status',
      description: 'Look for cars with recent inspection reports. These provide valuable insights into the car&apos;s condition.',
      icon: '🔍'
    }
  ];

  const safetyTips = [
    'Always meet in a public place for the first viewing',
    'Bring someone with you if possible',
    'Check the car&apos;s VIN and registration documents',
    'Take it for a test drive before committing',
    'Consider getting a mechanic to inspect it',
    'Verify the seller&apos;s identity and ownership',
    'Use secure payment methods for transactions',
    'Trust your instincts - if something feels off, walk away'
  ];

  const StepCard: React.FC<StepCardProps> = ({ step, index }) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 mb-2 border border-gray-100">
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-green-700 to-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
              {index + 1}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">{step.description}</p>
            
            {step.tip && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-3 rounded-r-lg">
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">💡 Tip:</span> {step.tip}
                </p>
              </div>
            )}
            
            {step.important && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-3 rounded-r-lg">
                <p className="text-orange-800 text-sm">
                  <span className="font-semibold">⚠️ Important:</span> {step.important}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 text-4xl opacity-80">
            {step.visual}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-16 px-8 rounded-3xl shadow-lg max-w-6xl mx-auto">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Buyer&apos;s Guide</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Your complete guide to finding and buying the perfect car on CarJai
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8">
        {/* Introduction */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl p-8 mb-6 shadow-md">
          <h2 className="text-3xl font-bold mb-3">Finding Your Perfect Car</h2>
          <p className="text-green-100 text-lg">
            Browse thousands of verified listings. Connect directly with sellers. No middleman fees!
          </p>
        </div>

        {/* Steps */}
        <div className="pb-8">
          {buyerSteps.map((step, idx) => (
            <StepCard key={step.id} step={step} index={idx} />
          ))}
        </div>

        {/* Search Tips */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Search className="w-8 h-8 text-green-600" />
            Smart Search Tips
          </h3>
          <div className="space-y-4">
            {searchTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                <span className="text-3xl">{tip.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-3">
            <Shield className="w-6 h-6" />
            Safety Tips
          </h3>
          <div className="space-y-3 text-green-900">
            {safetyTips.map((tip, idx) => (
              <p key={idx} className="flex items-start gap-3">
                <span className="text-green-700 font-bold">✓</span>
                <span>{tip}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 justify-center items-center">
          <Link 
            href="/browse"
            className="bg-gradient-to-r from-green-700 to-green-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all hover:scale-105 inline-block text-center"
          >
            Start Browsing Cars
          </Link>
          <Link 
            href="/"
            className="text-gray-500 hover:text-gray-700 hover:underline transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}