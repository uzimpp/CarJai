import Cta from "@/components/global/Cta";

export default function Pricing() {
  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Hero Section */}
      <section className="text-center mb-(--space-2xl)">
        <div className="relative">
          <h1 className="text-6 font-bold text-maroon mb-(--space-s) leading-tight">
            Price Estimation Formula
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-maroon to-red mx-auto mb-(--space-m) rounded-full"></div>
          <p className="text-1 text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Learn how we calculate estimated prices for second-hand cars using a
            formula based on{" "}
            <span className="font-bold text-maroon">transparency</span> and{" "}
            <span className="font-bold text-maroon">accuracy</span>.
          </p>
        </div>
      </section>

      {/* Main Formula Section */}
      <section className="mb-(--space-2xl)">
        <div className="grid md:grid-cols-2 gap-(--space-xl) items-center mb-(--space-2xl)">
          <div>
            <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
              Estimated Price Formula
            </h2>
            <p className="text-1 text-gray-600 mb-(--space-m) leading-relaxed">
              Our price estimation uses a transparent calculation method that
              considers multiple factors to provide you with an accurate
              estimate. The formula ensures fairness and reliability in every
              assessment.
            </p>
            <div className="space-y-(--space-s)">
              {[
                "Average base price from market range",
                "Adjustment factors based on vehicle condition",
                "Transparent point system for various criteria",
                "Special deductions for significant issues",
              ].map((point, index) => (
                <div key={index} className="flex items-center gap-(--space-s)">
                  <div className="w-2 h-2 bg-maroon rounded-full flex-shrink-0"></div>
                  <span className="text-0 text-gray-600">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-maroon/10 to-red/10 rounded-2xl p-(--space-xl) h-80 flex items-center justify-center border border-maroon/20 shadow-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-maroon rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2 font-bold text-maroon mb-(--space-2xs)">
                  Transparent Calculation
                </h3>
                <p className="text-0 text-gray-600">
                  Every estimate is calculated using our proven formula
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formula Details */}
        <div className="bg-white rounded-2xl shadow-lg p-(--space-xl) border border-gray-100">
          <div className="text-center mb-(--space-xl)">
            <h2 className="text-4 font-bold text-gray-900 mb-(--space-2xs)">
              How We Calculate
            </h2>
            <p className="text-0 text-gray-600">
              Understanding our transparent pricing methodology
            </p>
          </div>

          {/* Estimated Price Formula */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-(--space-l) mb-(--space-xl)">
            <div className="text-center mb-(--space-m)">
              <h3 className="text-3 font-bold text-gray-900 mb-(--space-s)">
                Estimated Price
              </h3>
              <div className="text-2xl font-bold text-gray-900">
                <span className="text-gray-900">Estimated price</span> = (
                <span className="text-maroon">Min price</span> +{" "}
                <span className="text-red-600">Max price</span>) / 2 ×{" "}
                <span className="text-maroon">Adjustment factors</span>
              </div>
            </div>

            {/* Formula Breakdown */}
            <div className="grid md:grid-cols-3 gap-(--space-m) mt-(--space-l)">
              <div className="text-center p-(--space-m) bg-white rounded-lg border border-gray-200">
                <div className="text-maroon font-bold text-1 mb-(--space-2xs)">
                  Min Price
                </div>
                <div className="text-0 text-gray-600">Minimum market value</div>
              </div>
              <div className="text-center p-(--space-m) bg-white rounded-lg border border-gray-200">
                <div className="text-red-600 font-bold text-1 mb-(--space-2xs)">
                  Max Price
                </div>
                <div className="text-0 text-gray-600">Maximum market value</div>
              </div>
              <div className="text-center p-(--space-m) bg-white rounded-lg border border-gray-200">
                <div className="text-maroon font-bold text-1 mb-(--space-2xs)">
                  Adjustment Factors
                </div>
                <div className="text-0 text-gray-600">
                  Condition-based multiplier
                </div>
              </div>
            </div>
          </div>

          {/* Adjustment Factors Formula */}
          <div className="bg-gradient-to-br from-maroon/10 to-red/10 rounded-xl p-(--space-l) border border-maroon/20">
            <div className="text-center mb-(--space-m)">
              <h3 className="text-3 font-bold text-maroon mb-(--space-s)">
                Adjustment Factors
              </h3>
              <div className="text-xl font-bold text-gray-800 mb-(--space-s)">
                <span className="text-maroon">Adjustment factors</span> = 1 + (
                <span className="text-maroon">Stars Points</span> +{" "}
                <span className="text-maroon">Mileage Points</span> +{" "}
                <span className="text-maroon">Inspection Points</span> +{" "}
                <span className="text-red-600">Special Deductions</span>) / 100
              </div>
            </div>

            {/* Adjustment Factors Components */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-(--space-m) mt-(--space-l)">
              <div className="bg-white rounded-lg p-(--space-m) border-l-4 border-maroon">
                <div className="text-maroon font-bold text-1 mb-(--space-2xs)">
                  Stars Points
                </div>
                <div className="text-0 text-gray-600 mb-(--space-2xs)">
                  Vehicle condition rating
                </div>
                <div className="text-0 font-semibold text-gray-700">
                  Max: +10
                </div>
                <div className="text-0 font-semibold text-gray-700">
                  Min: -10
                </div>
              </div>

              <div className="bg-white rounded-lg p-(--space-m) border-l-4 border-maroon">
                <div className="text-maroon font-bold text-1 mb-(--space-2xs)">
                  Mileage Points
                </div>
                <div className="text-0 text-gray-600 mb-(--space-2xs)">
                  Based on odometer reading
                </div>
                <div className="text-0 font-semibold text-gray-700">
                  Max: +5
                </div>
                <div className="text-0 font-semibold text-gray-700">
                  Min: -5
                </div>
              </div>

              <div className="bg-white rounded-lg p-(--space-m) border-l-4 border-maroon">
                <div className="text-maroon font-bold text-1 mb-(--space-2xs)">
                  Inspection Points
                </div>
                <div className="text-0 text-gray-600 mb-(--space-2xs)">
                  Professional inspection results
                </div>
                <div className="text-0 font-semibold text-gray-700">
                  Max: +5
                </div>
                <div className="text-0 font-semibold text-gray-700">
                  Min: -5
                </div>
              </div>

              <div className="bg-white rounded-lg p-(--space-m) border-l-4 border-red-600">
                <div className="text-red-600 font-bold text-1 mb-(--space-2xs)">
                  Special Deductions
                </div>
                <div className="text-0 text-gray-600 mb-(--space-2xs)">
                  Major damage penalties
                </div>
                <div className="text-0 font-semibold text-red-600 mb-(--space-2xs)">
                  Flooded: -30
                </div>
                <div className="text-0 font-semibold text-red-600">
                  Heavy crashed: -40
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explanation Section */}
      <section className="mb-(--space-2xl)">
        <div className="text-center mb-(--space-xl)">
          <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
            Calculation Process
          </h2>
          <p className="text-1 text-gray-600 max-w-2xl mx-auto">
            Step-by-step guide on how we calculate your vehicle&apos;s estimated
            price
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-(--space-xl)">
          {/* How It Works */}
          <div className="bg-gradient-to-br from-maroon/10 to-red/10 rounded-2xl p-(--space-xl) border border-maroon/20">
            <div className="flex items-center gap-(--space-s) mb-(--space-m)">
              <div className="w-10 h-10 bg-maroon rounded-full flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-3 font-bold text-gray-900">How It Works</h3>
            </div>
            <div className="space-y-(--space-s)">
              {[
                "Calculate average base price from min and max market values",
                "Sum all points (stars, mileage, inspection, special deductions)",
                "Calculate adjustment factor by dividing total points by 100 and adding 1",
                "Multiply average price by adjustment factor to get final estimated price",
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-(--space-s)">
                  <div className="w-5 h-5 bg-maroon rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-0 text-gray-700 leading-relaxed">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Example Calculation */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-(--space-xl) border border-gray-200">
            <div className="flex items-center gap-(--space-s) mb-(--space-m)">
              <div className="w-10 h-10 bg-maroon rounded-full flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-3 font-bold text-gray-900">
                Example Calculation
              </h3>
            </div>
            <div className="space-y-(--space-s) text-0 text-gray-700">
              <div>
                <span className="font-semibold">Given data:</span>
                <ul className="list-disc list-inside ml-(--space-xs) mt-(--space-2xs)">
                  <li>Min price: 500,000 THB</li>
                  <li>Max price: 700,000 THB</li>
                  <li>Stars Points: +8</li>
                  <li>Mileage Points: -2</li>
                  <li>Inspection Points: +3</li>
                  <li>Special Deductions: 0</li>
                </ul>
              </div>
              <div className="pt-(--space-s) border-t border-gray-300">
                <span className="font-semibold">Calculation:</span>
                <div className="mt-(--space-2xs) space-y-(--space-2xs)">
                  <div>Average price = (500,000 + 700,000) / 2 = 600,000</div>
                  <div>Total points = 8 + (-2) + 3 + 0 = 9</div>
                  <div>Adjustment factor = 1 + (9 / 100) = 1.09</div>
                  <div className="font-bold text-maroon">
                    Estimated price = 600,000 × 1.09 = 654,000 THB
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notes Section */}
      <section className="mb-(--space-2xl)">
        <div className="text-center mb-(--space-xl)">
          <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
            Important Notes
          </h2>
          <p className="text-1 text-gray-600 max-w-2xl mx-auto">
            Understanding the limitations and purpose of price estimation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-(--space-m)">
          {[
            {
              icon: (
                <svg
                  className="w-8 h-8 text-maroon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
              title: "Estimate Only",
              description:
                "The estimated price is a calculated approximation based on available data. Actual prices may vary based on vehicle condition and other factors.",
            },
            {
              icon: (
                <svg
                  className="w-8 h-8 text-maroon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              ),
              title: "Limited Range",
              description:
                "Stars, mileage, and inspection points have capped ranges to ensure reasonable and fair assessments.",
            },
            {
              icon: (
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              ),
              title: "Special Deductions",
              description:
                "Major issues like flooding or heavy crashes receive significant point deductions to reflect potential damage and repair costs.",
            },
          ].map((note, index) => (
            <div
              key={index}
              className="text-center p-(--space-m) rounded-xl hover:shadow-md transition-all bg-white border border-gray-200"
            >
              <div className="flex justify-center mb-(--space-s)">
                <div className="w-16 h-16 bg-maroon/10 rounded-full flex items-center justify-center">
                  {note.icon}
                </div>
              </div>
              <h3 className="text-2 font-bold text-gray-900 mb-(--space-2xs)">
                {note.title}
              </h3>
              <p className="text-0 text-gray-600 leading-relaxed">
                {note.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Cta />
    </div>
  );
}
