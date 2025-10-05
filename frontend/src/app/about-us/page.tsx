export default function AboutUs() {
  return (
    <div className="!pb-(--space-l) px-(--space-m) py-(--space-s) max-w-[1024px] mx-auto">
      <header className="mb-(--space-l)">
        <h1 className="text-6 font-bold text-maroon">About CarJai</h1>
      </header>

      <section className="mb-(--space-l)">
        <p className="text-grey text--1">
          CarJai is a second-hand car marketplace platform that is the most
          <span className="font-bold">
            {" "}
            easy, transparent, and trustworthy{" "}
          </span>
          in Thailand. We connect car owners who want to sell quickly with
          buyers who want transparent and reliable information.
        </p>
      </section>

      <section className="mb-(--space-l)">
        <h2 className="text-2 font-bold text-grey mb-(--space-xs)">
          Our Mission
        </h2>
        <p className="text-grey text--1 mb-(--space-xs)">
          We are committed to making buying and selling second-hand cars in
          Thailand easy, safe, and transparent. Reducing the problems that car
          owners and buyers face every day:
        </p>
        <ul className="list-disc pl-6 text-grey text--1 grid gap-(--space-2xs)">
          <li>Unreliable listings</li>
          <li>Complex and unfair deals</li>
          <li>Incomplete and inconsistent information</li>
        </ul>
      </section>

      <section className="mb-(--space-l)">
        <h2 className="text-2 font-bold text-grey mb-(--space-xs)">
          Why the name &quot;CarJai&quot;?
        </h2>
        <p className="text-grey text--1">
          The name <span className="font-bold">CarJai</span> comes from the
          combination of
          <span className="font-bold"> Car </span>(vehicle) and{" "}
          <span className="font-bold">&quot;Jai&quot;</span> (heart) in Thai
        </p>
        <ul className="list-none mt-(--space-xs) text-grey text--1 grid gap-(--space-2xs)">
          <li>🚗 Car = The vehicle at the heart of our business</li>
          <li>❤️ Jai (Heart) = Sincerity, transparency, and trust</li>
        </ul>
        <p className="text-grey text--1 mt-(--space-xs)">
          Because we firmly believe that{" "}
          <span className="font-bold">trust is the most important thing</span>{" "}
          in buying and selling second-hand cars
        </p>
      </section>

      <section className="mb-(--space-l)">
        <h2 className="text-2 font-bold text-grey mb-(--space-xs)">
          CarJai is not just another car listing platform
        </h2>
        <div className="grid gap-(--space-m) md:grid-cols-2">
          <div>
            <h3 className="font-bold text-grey mb-(--space-2xs)">
              For Sellers
            </h3>
            <ul className="list-disc pl-6 text-grey text--1 grid gap-(--space-2xs)">
              <li>
                ✅ List with confidence that information and documents will be
                presented transparently
              </li>
              <li>✅ Reach serious buyers who are ready to make decisions</li>
              <li>✅ Sell faster with a reliable system</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-grey mb-(--space-2xs)">For Buyers</h3>
            <ul className="list-disc pl-6 text-grey text--1 grid gap-(--space-2xs)">
              <li>
                ✅ Make decisions with peace of mind because information is
                clear and verifiable
              </li>
              <li>
                ✅ Contact sellers directly without going through intermediaries
              </li>
              <li>✅ Confidence in every purchase with a transparent system</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-(--space-l)">
        <h2 className="text-2 font-bold text-grey mb-(--space-xs)">
          Our Vision
        </h2>
        <blockquote className="border-l-4 border-red pl-(--space-s) text-grey italic text--1">
          &quot;To be a platform that puts the hearts of buyers and sellers at
          the center of every transaction&quot;
        </blockquote>
        <p className="text-grey text--1 mt-(--space-s)">
          We make every deal happen with:
        </p>
        <ul className="list-disc pl-6 text-grey text--1 grid gap-(--space-2xs) mt-(--space-2xs)">
          <li>
            <span className="font-bold">Fairness</span> - No deception or hidden
            information
          </li>
          <li>
            <span className="font-bold">Transparency</span> - Complete
            information verifiable at every step
          </li>
          <li>
            <span className="font-bold">Trustworthiness</span> - High-level
            security system
          </li>
        </ul>
      </section>

      <footer className="mt-(--space-xl)">
        <p className="text-grey text--1 font-bold">
          CarJai - Caring in every transaction, trusting in every deal
        </p>
      </footer>
    </div>
  );
}
