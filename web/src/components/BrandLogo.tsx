import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Compact = icon + short wordmark for nav; full = large lockup */
  variant?: "nav" | "hero" | "login";
  href?: string | null;
  priority?: boolean;
};

/**
 * Brand lockup for Total Rewards Accelerator.
 * Asset: /public/brand/tra-logo.png (full logo with wordmark).
 */
export function BrandLogo({ variant = "nav", href = "/", priority = false }: Props) {
  const sizes = {
    nav: { width: 180, height: 98, className: "h-10 w-auto sm:h-11" },
    hero: { width: 320, height: 175, className: "h-28 w-auto sm:h-32" },
    login: { width: 260, height: 142, className: "mx-auto h-24 w-auto" },
  }[variant];

  const img = (
    <Image
      src="/brand/tra-logo.png"
      alt="Total Rewards Accelerator — Making compensation easy for all"
      width={sizes.width}
      height={sizes.height}
      className={`${sizes.className} object-contain object-left`}
      priority={priority}
    />
  );

  if (href === null) {
    return <div className="inline-flex shrink-0">{img}</div>;
  }

  return (
    <Link href={href} className="inline-flex shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-lg">
      {img}
    </Link>
  );
}
