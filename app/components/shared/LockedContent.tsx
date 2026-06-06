import routes from "@/app/configs/route-paths";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { IoIosLock } from "react-icons/io";

type Props = {
  title: string;
  reason?: string;
  // Defaults to a "View plans" CTA that routes to /pricing.
  ctaLabel?: string;
  onCta?: () => void;
  // Optional second action, e.g. "Use contact credit" when the user has credits.
  secondaryLabel?: string;
  onSecondary?: () => void;
  icon?: ReactNode;
  className?: string;
};

/**
 * Reusable panel for subscription-gated content. Use in match details, advanced
 * filters, chat composer, photo gallery, and contact reveal so locked states
 * read consistently.
 */
const LockedContent = ({
  title,
  reason,
  ctaLabel = "View Plans",
  onCta,
  secondaryLabel,
  onSecondary,
  icon,
  className,
}: Props) => {
  const router = useRouter();

  const handleCta = () => {
    if (onCta) return onCta();
    router.push(routes.pricing);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 rounded-2xl border border-dashed border-default-200 bg-default-50 p-8 ${className ?? ""}`}
    >
      <div className="bg-primary/10 text-primary p-3 rounded-full">
        {icon ?? <IoIosLock size={24} />}
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {reason && (
        <p className="text-sm text-default-500 max-w-xs leading-relaxed">
          {reason}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
        <Button color="primary" size="sm" onPress={handleCta}>
          {ctaLabel}
        </Button>
        {secondaryLabel && onSecondary && (
          <Button variant="flat" size="sm" onPress={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LockedContent;
