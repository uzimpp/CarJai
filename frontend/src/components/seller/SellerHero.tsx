interface SellerHeroProps {
  title: string;
  subtitle?: string | null;
}

export default function SellerHero({ title, subtitle }: SellerHeroProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-red text-white">
      <div className="max-w-[1200px] mx-auto px-(--space-m) py-(--space-xl)">
        <div className="flex items-center gap-(--space-l)">
          <div className="w-24 h-24 rounded-full bg-white/10 ring-4 ring-white/20 flex items-center justify-center text-2xl font-bold">
            {title?.[0] || "S"}
          </div>
          <div className="flex-1">
            <h1 className="text-5 font-bold leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-0 text-white/90 mt-(--space-2xs)">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
