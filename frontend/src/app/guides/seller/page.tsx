'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, User, Camera, CheckCircle, Sparkles, Shield, DollarSign, Edit, TrendingUp, Users } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
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

export default function SellerGuides() {
  const router = useRouter();

  const sellerSteps: Step[] = [
    {
      id: 1,
      title: 'Create Your Seller Account',
      icon: User,
      description: 'Sign up with your email and password. Once you&apos;re in, you can start listing your car right away!',
      visual: '📝',
      tip: 'Complete your profile to build trust with potential buyers'
    },
    {
      id: 2,
      title: 'Complete Your Profile',
      icon: User,
      description: 'Add your display name and contact info so buyers can reach you. You can also add a short bio and location.',
      visual: '👤',
      tip: 'A complete profile increases buyer confidence'
    },
    {
      id: 3,
      title: 'Snap a Photo of Your Registration',
      icon: Sparkles,
      description: 'Take a clear picture of your car&apos;s registration book. Our smart system will automatically fill in the details for you!',
      badge: 'OPTIONAL',
      tip: 'This saves you tons of typing - but you can skip it and enter details manually',
      visual: '📸'
    },
    {
      id: 4,
      title: 'Add Inspection Report',
      icon: Shield,
      description: 'Have an inspection QR code? Paste the link and we&apos;ll pull in the official inspection data. This builds trust with buyers!',
      badge: 'OPTIONAL',
      visual: '✅',
      tip: 'Cars with inspection reports get 40% more inquiries'
    },
    {
      id: 5,
      title: 'Tell Us About Your Car',
      icon: Car,
      description: 'Fill in the details - price, year, mileage, color, and condition. Don&apos;t worry, most fields are optional!',
      visual: '🚗',
      tip: 'Be honest about condition - it builds trust and attracts serious buyers'
    },
    {
      id: 6,
      title: 'Upload Photos',
      icon: Camera,
      description: 'Add at least 5 great photos of your car. Show the exterior, interior, engine, and any special features. More photos = more interest!',
      important: 'Need at least 5 photos, max 12 photos',
      visual: '📷',
      tip: 'Good photos can increase your selling price by up to 15%'
    },
    {
      id: 7,
      title: 'Set Your Price',
      icon: DollarSign,
      description: 'Research similar cars and set a competitive price. You can always adjust it later based on market response.',
      visual: '💰',
      tip: 'Price slightly above your minimum to leave room for negotiation'
    },
    {
      id: 8,
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
      title: 'Track Performance',
      description: 'See how many people viewed your listing and contacted you',
      icon: '📊'
    },
    {
      title: 'Mark as Sold',
      description: 'When your car sells, just mark it sold. It stays in your history but disappears from search',
      icon: '✨'
    },
    {
      title: 'Manage Inquiries',
      description: 'Respond to buyer questions quickly to maintain interest',
      icon: '💬'
    }
  ];

  const photoTips = [
    'Take photos in good lighting (daytime works best)',
    'Clean your car before photographing',
    'Show all angles - front, back, sides, interior',
    'Highlight any special features or upgrades',
    'Include close-ups of any damage or wear',
    'Take photos of the engine bay and trunk',
    'Show the odometer reading clearly',
    'Capture the interior from multiple angles'
  ];

  const pricingTips = [
    {
      title: 'Research Market Value',
      description: 'Check similar cars in your area to understand market pricing',
      icon: '🔍'
    },
    {
      title: 'Consider Condition',
      description: 'Adjust price based on your car&apos;s actual condition and mileage',
      icon: '⚖️'
    },
    {
      title: 'Factor in Urgency',
      description: 'Need to sell quickly? Price competitively. Have time? Start higher',
      icon: '⏰'
    },
    {
      title: 'Leave Room to Negotiate',
      description: 'Most buyers expect to negotiate, so price slightly above your minimum',
      icon: '🤝'
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
      <div className="bg-gradient-to-r from-red-900 to-red-800 text-white py-16 px-8 rounded-3xl shadow-lg max-w-6xl mx-auto">
        <div className="text-center">
          <Car className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Seller&apos;s Guide</h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            Your complete guide to selling your car quickly and safely on CarJai
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8">
        {/* Introduction */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-white rounded-2xl p-8 mb-6 shadow-md">
          <h2 className="text-3xl font-bold mb-3">Selling Your Car</h2>
          <p className="text-red-100 text-lg">
            List your car and get connected with serious buyers across the country!
          </p>
        </div>

        {/* Steps */}
        <div className="pb-8">
          {sellerSteps.map((step, idx) => (
            <StepCard key={step.id} step={step} index={idx} />
          ))}
        </div>

        {/* After Publishing */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-red-600" />
            After You Publish
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {sellerManagement.map((item, idx) => (
              <div key={idx} className="text-center p-5 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Tips */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-3">
            <Camera className="w-6 h-6" />
            Photo Tips for Best Results
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-red-900">
            {photoTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-red-800 font-bold">✓</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Tips */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-red-600" />
            Pricing Your Car Right
          </h3>
          <div className="space-y-4">
            {pricingTips.map((tip, idx) => (
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

        {/* Success Tips */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-green-600" />
            Tips for Success
          </h3>
          <div className="space-y-3 text-gray-800">
            <p className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Respond to inquiries quickly - buyers appreciate fast communication</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Be honest about your car&apos;s condition to build trust</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Keep your listing updated with current information</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Be flexible with viewing times to accommodate buyers</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Have all necessary documents ready for serious buyers</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 justify-center items-center">
          <Link 
            href="/sell"
            className="bg-gradient-to-r from-red-900 to-red-800 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all hover:scale-105 inline-block text-center"
          >
            Start Selling Your Car
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