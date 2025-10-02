import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <div className="max-w-[1536px] mx-auto pt-8">
      {/* Main Footer Content */}
      <div className="flex sm:flex-row flex-col-reverse gap-(--space-xl) justify-between p-(--space-l-xl) text-white">
        {/* Brand Section */}
        <div className="sm:max-w-1/2 max-w-full">
          <div className="flex items-center gap-(--space-2xs) mb-(--space-m) ">
            <Image
              src="/logo/logo.png"
              alt="CarJai Logo"
              width={32}
              height={32}
            />
            <h3 className="text-2 font-bold text-white">CarJai</h3>
          </div>
          <p className="text-0 text-white/90 mb-(--space-m) leading-relaxed">
            Trusted second-hand car marketplace, where every transaction is
            built on transparency, trust, and genuine care.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-1 font-bold text-white mb-(--space-m)">
            Quick Links
          </h4>
          <ul className="space-y-(--space-2xs)">
            {[
              { name: "Browse Cars", href: "/buy" },
              { name: "Sell Your Car", href: "/sell" },
              { name: "About Us", href: "/about-us" },
              { name: "How It Works", href: "/guides" },
              { name: "Pricing", href: "/pricing" },
            ].map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="text-0 text-gray-300 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
