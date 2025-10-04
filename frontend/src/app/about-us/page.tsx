import Cta from "@/components/global/Cta";

export default function AboutUs() {
  return (
    <div className="!pb-(--space-l) px-(--space-m) py-(--space-s) max-w-[1536px] mx-auto">
      {/* Hero Section */}
      <section className="text-center mb-(--space-2xl)">
        <div className="relative">
          <h1 className="text-7 font-bold text-maroon mb-(--space-s) leading-tight">
            About CarJai
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-maroon to-red mx-auto mb-(--space-m)"></div>
          <p className="text-2 text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Thailand&apos;s most trusted second-hand car marketplace, where
            every transaction is built on{" "}
            <span className="font-bold text-maroon">transparency</span>,
            <span className="font-bold text-maroon"> trust</span>, and
            <span className="font-bold text-maroon"> genuine care</span>.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mb-(--space-2xl)">
        <div className="grid md:grid-cols-2 gap-(--space-xl) items-center">
          <div>
            <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
              Our Mission
            </h2>
            <p className="text-1 text-gray-600 mb-(--space-m) leading-relaxed">
              We&apos;re revolutionizing the second-hand car market in Thailand
              by eliminating the pain points that plague both buyers and
              sellers. Our platform ensures every transaction is smooth,
              transparent, and trustworthy.
            </p>
            <div className="space-y-(--space-s)">
              {[
                "Unreliable listings with hidden issues",
                "Complex and unfair negotiation processes",
                "Incomplete and inconsistent vehicle information",
              ].map((problem, index) => (
                <div key={index} className="flex items-center gap-(--space-s)">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-0 text-gray-600">{problem}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-maroon/10 to-red/10 rounded-2xl p-(--space-xl) h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-(--space-s)">🎯</div>
                <h3 className="text-2 font-bold text-maroon mb-(--space-2xs)">
                  Our Goal
                </h3>
                <p className="text-0 text-gray-600">
                  Make car buying & selling effortless
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why CarJai Section */}
      <section className="mb-(--space-2xl)">
        <div className="text-center mb-(--space-xl)">
          <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
            Why &quot;CarJai&quot;?
          </h2>
          <p className="text-1 text-gray-600 max-w-2xl mx-auto">
            Our name reflects our core values and commitment to putting people
            first
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-(--space-xl) items-center">
          <div className="space-y-(--space-m)">
            <div className="flex items-center gap-(--space-s)">
              <div className="w-12 h-12 bg-maroon/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <h3 className="text-2 font-bold text-gray-900">Car</h3>
                <p className="text-0 text-gray-600">
                  The vehicle at the heart of our business
                </p>
              </div>
            </div>
            <div className="flex items-center gap-(--space-s)">
              <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">❤️</span>
              </div>
              <div>
                <h3 className="text-2 font-bold text-gray-900">Jai (Heart)</h3>
                <p className="text-0 text-gray-600">
                  Sincerity, transparency, and trust in every interaction
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-maroon to-red rounded-2xl p-(--space-xl) text-white">
            <blockquote className="text-2 font-medium italic mb-(--space-s)">
              &quot;Trust is the foundation of every successful car
              transaction&quot;
            </blockquote>
            <p className="text-0 text-white/90">
              We believe that when both buyers and sellers can trust the
              process, everyone wins. That&apos;s why we&apos;ve built CarJai
              with transparency and reliability at its core.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="mb-(--space-2xl)">
        <div className="text-center mb-(--space-xl)">
          <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
            More Than Just a Listing Platform
          </h2>
          <p className="text-1 text-gray-600 max-w-2xl mx-auto">
            We&apos;re building a community where car transactions happen with
            confidence and care
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-(--space-xl)">
          {/* For Sellers */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-(--space-xl)">
            <div className="flex items-center gap-(--space-s) mb-(--space-m)">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">👨‍💼</span>
              </div>
              <h3 className="text-3 font-bold text-gray-900">For Sellers</h3>
            </div>
            <div className="space-y-(--space-s)">
              {[
                "List with confidence - transparent information presentation",
                "Reach serious buyers ready to make decisions",
                "Sell faster with our reliable verification system",
                "No hidden fees or surprise charges",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-(--space-s)">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-0 text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* For Buyers */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-(--space-xl)">
            <div className="flex items-center gap-(--space-s) mb-(--space-m)">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🛒</span>
              </div>
              <h3 className="text-3 font-bold text-gray-900">For Buyers</h3>
            </div>
            <div className="space-y-(--space-s)">
              {[
                "Make informed decisions with verified information",
                "Contact sellers directly - no middlemen",
                "Confidence in every purchase with our guarantee",
                "Comprehensive vehicle history and documentation",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-(--space-s)">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-0 text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mb-(--space-2xl)">
        <div className="text-center mb-(--space-xl)">
          <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
            Our Core Values
          </h2>
          <p className="text-1 text-gray-600 max-w-2xl mx-auto">
            Every decision we make is guided by these fundamental principles
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-(--space-m)">
          {[
            {
              icon: "⚖️",
              title: "Fairness",
              description:
                "No deception, hidden information, or unfair practices. Every transaction is transparent and honest.",
            },
            {
              icon: "🔍",
              title: "Transparency",
              description:
                "Complete information that&apos;s verifiable at every step. What you see is what you get.",
            },
            {
              icon: "🛡️",
              title: "Trustworthiness",
              description:
                "High-level security systems and verification processes to protect every user.",
            },
          ].map((value, index) => (
            <div
              key={index}
              className="text-center p-(--space-m) rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="text-4xl mb-(--space-s)">{value.icon}</div>
              <h3 className="text-2 font-bold text-gray-900 mb-(--space-2xs)">
                {value.title}
              </h3>
              <p className="text-0 text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-(--space-2xl) text-white mb-(--space-2xl)">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5 font-bold mb-(--space-m)">Our Vision</h2>
          <blockquote className="text-3 italic mb-(--space-m) leading-relaxed">
            &quot;To be the platform that puts the hearts of buyers and sellers
            at the center of every transaction, creating a marketplace where
            trust, transparency, and genuine care drive every interaction.&quot;
          </blockquote>
          <div className="w-24 h-1 bg-gradient-to-r from-maroon to-red mx-auto"></div>
        </div>
      </section>

      <Cta />
    </div>
  );
}
