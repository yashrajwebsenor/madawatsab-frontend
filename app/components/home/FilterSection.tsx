import { useState } from "react";
import { useRouter } from "next/navigation";
import DiscoverFilters, {
  buildFilterParams,
  defaultFilters,
  Filters,
} from "./DiscoverFilters";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";

// Home-feed filter panel: a thin URL-sync wrapper around the shared
// `DiscoverFilters`. The home feed reads its query off the URL, so Apply pushes
// the chosen filters as a query string and Clear resets it. The /search page
// reuses the same panel but folds the filters into its React Query instead.
const FilterSection = () => {
  const router = useRouter();
  const { canUseAdvancedFilters } = useSubscriptionAccess();
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const handleApply = (next: Filters) => {
    const queryString = new URLSearchParams(
      buildFilterParams(next, canUseAdvancedFilters),
    ).toString();
    router.push(`?${queryString}`);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    router.push("?");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <DiscoverFilters
      filters={filters}
      setFilters={setFilters}
      onApply={handleApply}
      onReset={handleReset}
    />
  );
};

export default FilterSection;
