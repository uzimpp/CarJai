export default function Footer() {
  return (
    <footer
      className="px-(--space-m) py-(--space-s) gap-y-(--space-2xl-4xl)
    max-w-[1536px] mx-auto w-full flex justify-between flex-row items-center"
    >
      © {new Date().getFullYear()} CarJai All rights reserved.
    </footer>
  );
}
