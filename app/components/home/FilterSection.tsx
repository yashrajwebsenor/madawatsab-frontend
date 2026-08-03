import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DiscoverFilters, {
  buildFilterParams,
  defaultFilters,
  Filters,
} from "./DiscoverFilters";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";

// Reads the panel state back out of the query string. The URL is the source of
// truth for the home feed, so the panel has to mirror it — otherwise a reload
// (or back/forward) leaves the sidebar blank while the feed is still filtered,
// and the next Apply silently drops every filter that isn't re-picked.
const filtersFromParams = (params: URLSearchParams): Filters =>
  Object.fromEntries(
    Object.keys(defaultFilters).map((key) => [key, params.get(key) ?? ""]),
  ) as Filters;

// Home-feed filter panel: a thin URL-sync wrapper around the shared
// `DiscoverFilters`. The home feed reads its query off the URL, so Apply pushes
// the chosen filters as a query string and Clear resets it. The /search page
// reuses the same panel but folds the filters into its React Query instead.
const FilterSection = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canUseAdvancedFilters } = useSubscriptionAccess();
  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromParams(new URLSearchParams(searchParams.toString())),
  );

  // Re-sync whenever the URL changes (first paint after hydration, browser
  // back/forward, Clear). Keyed on the serialised query so it only fires on a
  // real change, not on every render.
  const queryString = searchParams.toString();
  useEffect(() => {
    setFilters(filtersFromParams(new URLSearchParams(queryString)));
  }, [queryString]);

  const handleApply = (next: Filters) => {
    const applied = new URLSearchParams(
      buildFilterParams(next, canUseAdvancedFilters),
    ).toString();
    router.push(`?${applied}`);
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
