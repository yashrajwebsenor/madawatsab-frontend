"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, Input, Spinner, Tab, Tabs } from "@heroui/react";
import { LuArrowLeft, LuSearch } from "react-icons/lu";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import routes from "@/app/configs/route-paths";
import { Match, ProfileMatch } from "@/app/types/types";
import MatchCard from "@/app/components/cards/MatchCard";
import { MatchGridSkeleton } from "@/app/components/shared/Skeletons";
import DiscoverFilters, {
  buildFilterParams,
  defaultFilters,
  Filters,
} from "@/app/components/home/DiscoverFilters";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";

// The three identifiers the platform can be searched by (client spec 2.1).
// `userId` already existed as a discover filter; `fullName` + `mobile` are the
// two added options. Each maps 1:1 to a discover query param so every base feed
// rule (opposite gender, onboarding, exclusions, paywall) still applies.
type SearchBy = "userId" | "fullName" | "mobile";

const SEARCH_FIELDS: Record<
  SearchBy,
  { label: string; placeholder: string; hint: string }
> = {
  userId: {
    label: "User ID",
    placeholder: "MADA0001",
    hint: "Exact member ID match.",
  },
  fullName: {
    label: "Full Name",
    placeholder: "e.g. Ahmed Khan",
    hint: "Partial name match.",
  },
  mobile: {
    label: "Mobile",
    placeholder: "10-digit mobile number",
    hint: "Exact mobile number match.",
  },
};

// Client-side mirror of the server rule (spec 2.2): a search only fires from 3
// characters on. The backend enforces the same, but gating here avoids a noisy
// "everyone" query on the first keystroke.
const MIN_CHARS = 3;

// Normalise input per field: User IDs are upper-cased, mobile is digits-only
// (max 10), names are left as typed.
const normalise = (by: SearchBy, raw: string) => {
  if (by === "userId") return raw.toUpperCase();
  if (by === "mobile") return raw.replace(/\D/g, "").slice(0, 10);
  return raw;
};

const SearchPage = () => {
  const router = useRouter();
  const { canUseAdvancedFilters } = useSubscriptionAccess();

  const [searchBy, setSearchBy] = useState<SearchBy>("userId");
  const [term, setTerm] = useState("");
  // Debounced value that actually drives the query, so we don't hit the API on
  // every keystroke.
  const [submitted, setSubmitted] = useState("");

  // Filters refine the results of an identifier search. `filters` is the live
  // panel state; `appliedFilters` is the committed copy that drives the query
  // (only changes on Apply, so editing the panel doesn't refire mid-typing).
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);

  useEffect(() => {
    const trimmed = term.trim();
    const id = setTimeout(
      () => setSubmitted(trimmed.length >= MIN_CHARS ? trimmed : ""),
      350,
    );
    return () => clearTimeout(id);
  }, [term]);

  // Same advanced gating the home feed uses — drops empty + (when not premium)
  // advanced keys. Memoised so it's a stable queryKey input.
  const filterParams = useMemo(
    () => buildFilterParams(appliedFilters, canUseAdvancedFilters),
    [appliedFilters, canUseAdvancedFilters],
  );

  const enabled = canUseAdvancedFilters && submitted.length >= MIN_CHARS;

  const {
    data,
    refetch,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["search", searchBy, submitted, filterParams],
    enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      // The axios interceptor unwraps to the response body, so the static
      // AxiosResponse type doesn't match the runtime shape — cast to it.
      const res = (await api.get(ENDPOINTS.PROFILE.DISCOVER, {
        params: {
          page: pageParam,
          limit: 12,
          [searchBy]: submitted,
          ...filterParams,
        },
      })) as unknown as {
        data?: Match[];
        pagination?: { totalPages?: number; total?: number };
      };
      return {
        items: res?.data ?? [],
        currentPage: pageParam,
        totalPages: res?.pagination?.totalPages ?? 1,
        total: res?.pagination?.total ?? 0,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined,
  });

  // Search is a targeted lookup, so drop the ad cards discover injects and keep
  // only profile results.
  const results = useMemo(
    () =>
      (data?.pages.flatMap((p) => p.items) ?? []).filter(
        (item): item is ProfileMatch => item.cardType === "profile",
      ),
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  // Search is gated by the advanced-filters capability. Non-eligible users are
  // never shown the search UI — they're redirected to the pricing screen.
  // `replace` so the back button doesn't bounce them straight back here.
  useEffect(() => {
    if (!canUseAdvancedFilters) router.replace(routes.pricing);
  }, [canUseAdvancedFilters, router]);

  if (!canUseAdvancedFilters) return null;

  const field = SEARCH_FIELDS[searchBy];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="container py-5"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <Button
            isIconOnly
            variant="light"
            radius="full"
            aria-label="Back"
            onPress={() => router.back()}
          >
            <LuArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold">Search members</h1>
        </div>

        {/* What to search by — User ID (existing) + Full Name & Mobile (new). */}
        <Tabs
          aria-label="Search by"
          color="primary"
          radius="full"
          selectedKey={searchBy}
          onSelectionChange={(key) => {
            setSearchBy(key as SearchBy);
            setTerm("");
            setSubmitted("");
          }}
          className="mb-3"
        >
          <Tab key="userId" title="User ID" />
          <Tab key="fullName" title="Full Name" />
          <Tab key="mobile" title="Mobile" />
        </Tabs>

        <Input
          autoFocus
          size="lg"
          variant="bordered"
          radius="lg"
          value={term}
          onValueChange={(v) => setTerm(normalise(searchBy, v))}
          placeholder={field.placeholder}
          inputMode={searchBy === "mobile" ? "numeric" : "text"}
          startContent={<LuSearch size={18} className="text-default-400" />}
          description={`${field.hint} Type at least ${MIN_CHARS} characters.`}
        />

        {/* Filters refine the identifier search above. Floating bottom-right FAB
            (same as the home feed); applied filters only take effect once
            there's a valid (3+ char) search term. */}
        <DiscoverFilters
          layout="button"
          filters={filters}
          setFilters={setFilters}
          onApply={setAppliedFilters}
          onReset={() => {
            setFilters(defaultFilters);
            setAppliedFilters(defaultFilters);
          }}
          subtitle="Refine your results"
        />

        {/* Results */}
        <div className="mt-6">
          {!enabled ? (
            <p className="py-10 text-center text-sm text-default-400">
              {term.trim().length > 0 && term.trim().length < MIN_CHARS
                ? `Keep typing — ${MIN_CHARS} characters minimum.`
                : `Search members by ${field.label.toLowerCase()}.`}
            </p>
          ) : isLoading ? (
            <MatchGridSkeleton />
          ) : results.length > 0 ? (
            <>
              <p className="mb-3 text-sm text-gray-700">
                Found <b>{total}</b> {total === 1 ? "member" : "members"}
              </p>
              <div className="grid gap-5 sm:grid-cols-3">
                {results.map((item, i) => (
                  <MatchCard
                    key={`${item._id}-${i}`}
                    profile={item}
                    refetch={refetch}
                    canInterestSendReceive
                  />
                ))}
              </div>

              {hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="flat"
                    color="primary"
                    isLoading={isFetchingNextPage}
                    onPress={() => fetchNextPage()}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          ) : isFetching ? (
            <div className="flex h-16 items-center justify-center">
              <Spinner size="md" color="primary" />
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-default-500">
              No members found for “{submitted}”.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchPage;
