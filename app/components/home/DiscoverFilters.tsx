import { ReactNode, useEffect, useState } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Slider,
  useDisclosure,
} from "@heroui/react";
import {
  LuSlidersHorizontal,
  LuSearch,
  LuCrown,
  LuMapPin,
  LuUserRound,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import MetadataDropdown from "../shared/MetadataDropdown";
import { MaritalStatus, MetadataTypes } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import noAutofill from "@/app/utils/no-autofill";
import useCountryCityStates from "@/app/hooks/useCountryCityStates";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";

// Keys the backend treats as advanced — only sent when the viewer has an active
// plan with `hasAdvancedFilters`. Everything else is a basic filter.
// (User ID search lives on the dedicated /search page, not here.)
export const ADVANCED_KEYS = [
  "qualification",
  "language",
  "annualIncome",
  "workSector",
] as const;

export const defaultFilters = {
  // basic
  minAge: "",
  maxAge: "",
  minHeight: "",
  maxHeight: "",
  country: "",
  state: "",
  location: "",
  maritalStatus: "",
  caste: "",
  community: "",
  // advanced
  qualification: "",
  language: "",
  annualIncome: "",
  workSector: "",
};

export type Filters = typeof defaultFilters;

// Turns a filter object into the plain query params the /profile/discover
// endpoint understands. Drops empty values and — when the viewer can't use
// advanced filters — strips the advanced keys (the backend would ignore them
// anyway, so don't pretend they're applied). Shared by the home URL-sync and
// the search page so both build params identically.
export const buildFilterParams = (
  filters: Filters,
  canUseAdvancedFilters: boolean,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => {
      if (value === "" || value === null || value === undefined) return false;
      if (!canUseAdvancedFilters && ADVANCED_KEYS.includes(key as never))
        return false;
      return true;
    }),
  );

// Locked premium field: a crown-badged row that routes to pricing. Replaces the
// greyed-out disabled input so each advanced field reads clearly as "unlock me".
const LockedField = ({
  label,
  onUpgrade,
}: {
  label: string;
  onUpgrade: () => void;
}) => (
  <button
    type="button"
    onClick={onUpgrade}
    aria-label={`${label} — upgrade to unlock`}
    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-amber-50/40 px-3 py-2.5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50"
  >
    <span className="text-sm font-medium text-default-600">{label}</span>
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-sm">
      <LuCrown size={13} />
    </span>
  </button>
);

// Consistent label + control wrapper so every field shares the same rhythm.
const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex min-h-5 items-center justify-between">
      <label className="text-xs font-semibold text-default-600">{label}</label>
      {hint}
    </div>
    {children}
  </div>
);

// Small uppercase eyebrow that opens each group of fields.
const SectionTitle = ({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-default-400">
      {icon}
      <p className="text-[11px] font-bold uppercase tracking-[0.12em]">
        {title}
      </p>
    </div>
    {action}
  </div>
);

const rangeChip = (min: string, max: string) =>
  min && max ? (
    <Chip
      size="sm"
      variant="flat"
      className="h-5 bg-primary/10 text-[10px] font-semibold text-primary"
    >
      {min} – {max}
    </Chip>
  ) : null;

// Isolated range slider. Keeps the dragged value in local state so each drag
// tick only re-renders this small component (not the whole filter panel, which
// caused stuttering). The parent's filters are updated once, on release.
const RangeSlider = ({
  label,
  minValue,
  maxValue,
  value,
  onCommit,
}: {
  label: string;
  minValue: number;
  maxValue: number;
  value: [number, number];
  onCommit: (value: [number, number]) => void;
}) => {
  const [local, setLocal] = useState<[number, number]>(value);
  // Tooltip is controlled so it only shows while actively dragging. Left to
  // HeroUI's default (focus/hover) the value bubble stays stuck on screen after
  // a drag — including while the page scrolls — until something else is clicked.
  const [isDragging, setIsDragging] = useState(false);

  // Keep local in sync when the parent resets filters (e.g. Clear).
  useEffect(() => {
    setLocal(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value[0], value[1]]);

  return (
    <Field label={label} hint={rangeChip(String(local[0]), String(local[1]))}>
      <Slider
        step={1}
        size="sm"
        minValue={minValue}
        maxValue={maxValue}
        showTooltip
        tooltipProps={{ isOpen: isDragging }}
        value={local}
        onChange={(v) => {
          if (!Array.isArray(v)) return;
          setIsDragging(true);
          setLocal([v[0], v[1]]);
        }}
        onChangeEnd={(v) => {
          setIsDragging(false);
          if (Array.isArray(v)) onCommit([v[0], v[1]]);
        }}
      />
    </Field>
  );
};

interface DiscoverFiltersProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  // Called when the user commits the panel (Apply). Receives the live filters.
  onApply: (filters: Filters) => void;
  // Called when the user clears all filters.
  onReset: () => void;
  // "sidebar" = home layout (persistent desktop sidebar + mobile sheet).
  // "button"  = inline trigger button that opens the panel as a sheet at every
  //             breakpoint (used by the centred /search layout).
  layout?: "sidebar" | "button";
  // Subtitle under the "Filters" header.
  subtitle?: string;
  // Extra classes for the inline trigger (layout="button" only).
  triggerClassName?: string;
}

// Controlled discover-filter panel. Owns no source-of-truth: the parent holds
// `filters` and decides what Apply/Reset do (home pushes them to the URL, the
// search page folds them into the discover query). Geo cascade + advanced
// gating live here since they're identical for every consumer.
const DiscoverFilters = ({
  filters,
  setFilters,
  onApply,
  onReset,
  layout = "sidebar",
  subtitle = "Refine your matches",
  triggerClassName,
}: DiscoverFiltersProps) => {
  const router = useRouter();
  const { canUseAdvancedFilters } = useSubscriptionAccess();
  const { countries, states, cities, fetchCountries, fetchStates, fetchCities } =
    useCountryCityStates();

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  useEffect(() => {
    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate the geo cascade when filters arrive pre-filled (e.g. restored from
  // the URL on load). Without this the State/City lists stay empty even though
  // a value is selected, because they're normally only fetched on change.
  // Split per level on purpose: `fetchStates` blanks the state *and* city lists
  // before it resolves, so re-running it on a state change would wipe the list
  // the selected state is displayed from.
  useEffect(() => {
    if (filters.country) fetchStates(Number(filters.country));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.country]);

  useEffect(() => {
    if (filters.country && filters.state)
      fetchCities(Number(filters.country), Number(filters.state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.country, filters.state]);

  const setField = (key: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const goPricing = () => router.push("/pricing");

  // Count applied filters (advanced ones only when the viewer can use them).
  const activeCount = Object.entries(filters).filter(([key, value]) => {
    if (!value) return false;
    if (!canUseAdvancedFilters && ADVANCED_KEYS.includes(key as never))
      return false;
    return true;
  }).length;

  // Cascade: changing the country clears any chosen state/city; clearing it (X)
  // resets the whole geo chain. The list fetches are handled by the hydrate
  // effect above, which reacts to country/state regardless of how they changed.
  const handleCountryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, country: value, state: "", location: "" }));
  };

  const handleStateChange = (value: string) => {
    setFilters((prev) => ({ ...prev, state: value, location: "" }));
  };

  // ---- Shared pieces (rendered both in the desktop sidebar and the mobile
  // bottom sheet) ----

  const clearButton = (
    <Button
      size="sm"
      color="primary"
      variant="light"
      onPress={onReset}
      isDisabled={activeCount === 0}
      className="h-6 min-w-0 px-2 text-xs font-medium"
    >
      Clear
    </Button>
  );

  const headerInner = (
    <div className="flex w-full items-center gap-3">
      <div className="rounded-xl bg-primary p-2 text-white shadow-md shadow-primary/30">
        <LuSlidersHorizontal size={16} />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <p className="font-semibold">Filters</p>
          {activeCount > 0 && (
            <Chip
              size="sm"
              variant="flat"
              className="h-5 min-w-5 bg-primary/10 text-[10px] font-semibold text-primary"
            >
              {activeCount}
            </Chip>
          )}
        </div>
        <p className="text-[11px] text-default-400">{subtitle}</p>
      </div>
    </div>
  );

  const applyButton = (
    <Button
      radius="lg"
      color="primary"
      onPress={() => {
        onApply(filters);
        onClose();
      }}
      startContent={<LuSearch size={16} />}
      className="w-full font-semibold shadow-lg shadow-primary/30"
    >
      Apply Filters
    </Button>
  );

  const fields = (
    <>
      {/* ---- Basic filters (always available) ---- */}
      <SectionTitle
        icon={<LuUserRound size={13} />}
        title="Basics"
        action={clearButton}
      />

      {/* Range sliders grouped into a soft panel */}
      <div className="flex flex-col gap-6 rounded-2xl bg-default-50 p-4">
        <RangeSlider
          label="Age range"
          minValue={18}
          maxValue={70}
          value={[Number(filters.minAge) || 18, Number(filters.maxAge) || 40]}
          onCommit={([min, max]) =>
            setFilters((prev) => ({
              ...prev,
              minAge: min.toString(),
              maxAge: max.toString(),
            }))
          }
        />

        <RangeSlider
          label="Height (cm)"
          minValue={140}
          maxValue={210}
          value={[
            Number(filters.minHeight) || 140,
            Number(filters.maxHeight) || 190,
          ]}
          onCommit={([min, max]) =>
            setFilters((prev) => ({
              ...prev,
              minHeight: min.toString(),
              maxHeight: max.toString(),
            }))
          }
        />
      </div>

      <Field label="Country">
        <Autocomplete
          size="sm"
          variant="bordered"
          radius="lg"
          aria-label="Country"
          inputProps={noAutofill("discover-country")}
          placeholder="Search country"
          selectedKey={filters.country || null}
          onSelectionChange={(key) => handleCountryChange((key as string) ?? "")}
        >
          {countries.map((item) => (
            <AutocompleteItem key={String(item.id)}>
              {item.name}
            </AutocompleteItem>
          ))}
        </Autocomplete>
      </Field>

      <Field label="State">
        <Autocomplete
          size="sm"
          variant="bordered"
          radius="lg"
          aria-label="State"
          inputProps={noAutofill("discover-state")}
          isDisabled={!filters.country}
          placeholder={filters.country ? "Search state" : "Select country first"}
          selectedKey={filters.state || null}
          onSelectionChange={(key) => handleStateChange((key as string) ?? "")}
        >
          {states.map((item) => (
            <AutocompleteItem key={String(item.id)}>
              {item.name}
            </AutocompleteItem>
          ))}
        </Autocomplete>
      </Field>

      <Field label="City">
        <Autocomplete
          size="sm"
          variant="bordered"
          radius="lg"
          aria-label="City"
          inputProps={noAutofill("discover-city")}
          isDisabled={!filters.state}
          placeholder={
            filters.state ? "Search city" : "Select country & state first"
          }
          selectedKey={filters.location || null}
          onSelectionChange={(key) => setField("location", (key as string) ?? "")}
        >
          {cities.map((item) => (
            <AutocompleteItem key={String(item.id)}>
              {item.name}
            </AutocompleteItem>
          ))}
        </Autocomplete>
      </Field>

      <Field label="Marital status">
        <Autocomplete
          size="sm"
          variant="bordered"
          radius="lg"
          aria-label="Marital Status"
          placeholder="All"
          selectedKey={filters.maritalStatus || null}
          onSelectionChange={(key) =>
            setField("maritalStatus", (key as string) ?? "")
          }
        >
          {Object.values(MaritalStatus).map((item) => (
            <AutocompleteItem key={item}>
              {CommonUtils.formatTitle(item)}
            </AutocompleteItem>
          ))}
        </Autocomplete>
      </Field>

      <Field label="Caste">
        <MetadataDropdown
          size="sm"
          radius="lg"
          placeholder="All"
          variant="bordered"
          selectedKey={filters.caste}
          metadataType={MetadataTypes.caste}
          onSelectionChange={(key) => setField("caste", (key as string) ?? "")}
        />
      </Field>

      <Field label="Community">
        <MetadataDropdown
          size="sm"
          radius="lg"
          placeholder="All"
          variant="bordered"
          selectedKey={filters.community}
          metadataType={MetadataTypes.community}
          onSelectionChange={(key) =>
            setField("community", (key as string) ?? "")
          }
        />
      </Field>

      {/* ---- Advanced filters (active sub + hasAdvancedFilters) ---- */}
      <div className="mt-2 border-t border-default-100 pt-5">
        <SectionTitle
          icon={<LuMapPin size={13} />}
          title="Advanced"
          action={
            !canUseAdvancedFilters && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                <LuCrown size={11} /> Premium
              </span>
            )
          }
        />
      </div>

      {canUseAdvancedFilters ? (
        <>
          <Field label="Qualification">
            <MetadataDropdown
              size="sm"
              radius="lg"
              placeholder="All"
              variant="bordered"
              selectedKey={filters.qualification}
              metadataType={MetadataTypes.qualification}
              onSelectionChange={(key) =>
                setField("qualification", (key as string) ?? "")
              }
            />
          </Field>

          <Field label="Work sector">
            <MetadataDropdown
              size="sm"
              radius="lg"
              placeholder="All"
              variant="bordered"
              selectedKey={filters.workSector}
              metadataType={MetadataTypes.employed_in}
              onSelectionChange={(key) =>
                setField("workSector", (key as string) ?? "")
              }
            />
          </Field>

          <Field label="Annual income">
            <MetadataDropdown
              size="sm"
              radius="lg"
              placeholder="All"
              variant="bordered"
              selectedKey={filters.annualIncome}
              metadataType={MetadataTypes.annual_income}
              onSelectionChange={(key) =>
                setField("annualIncome", (key as string) ?? "")
              }
            />
          </Field>

          <Field label="Language">
            <MetadataDropdown
              size="sm"
              radius="lg"
              variant="bordered"
              aria-label="Language"
              placeholder="All"
              selectedKey={filters.language}
              metadataType={MetadataTypes.language}
              onSelectionChange={(key) =>
                setField("language", (key as string) ?? "")
              }
            />
          </Field>
        </>
      ) : (
        <>
          <LockedField label="Qualification" onUpgrade={goPricing} />
          <LockedField label="Work sector" onUpgrade={goPricing} />
          <LockedField label="Annual income" onUpgrade={goPricing} />
          <LockedField label="Language" onUpgrade={goPricing} />

          <Button
            onPress={goPricing}
            startContent={<LuCrown size={15} />}
            className="bg-gradient-to-r from-amber-400 to-amber-500 font-semibold text-white shadow-sm"
          >
            Upgrade to unlock
          </Button>
        </>
      )}
    </>
  );

  // The bottom sheet is shared by both layouts; only the trigger differs.
  const sheet = (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom"
      classNames={{ closeButton: "top-2 right-6" }}
    >
      <DrawerContent className="max-h-[88dvh] rounded-t-3xl">
        <DrawerHeader className="border-b border-default-100 py-3">
          {headerInner}
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-5 py-4">{fields}</DrawerBody>
        <DrawerFooter className="border-t border-default-100">
          {applyButton}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  // Floating-trigger layout: a fixed bottom-right FAB (same style as the home
  // mobile trigger) shown at every breakpoint + the sheet. Used by the centred
  // /search page, which has no room for a persistent sidebar.
  if (layout === "button") {
    return (
      <>
        <Button
          onPress={onOpen}
          color="primary"
          radius="full"
          startContent={<LuSlidersHorizontal size={16} />}
          className={
            "fixed bottom-6 right-4 z-40 font-semibold shadow-lg shadow-primary/30 " +
            (triggerClassName ?? "")
          }
        >
          Filters
          {activeCount > 0 && (
            <Chip
              size="sm"
              variant="solid"
              className="h-5 min-w-5 bg-white/25 text-[10px] font-semibold text-white"
            >
              {activeCount}
            </Chip>
          )}
        </Button>
        {sheet}
      </>
    );
  }

  return (
    <>
      {/* Desktop: persistent sidebar (lg+ only — no room for 300px below that). */}
      <aside className="hidden w-[300px] shrink-0 lg:block">
        {/* Navbar (MainHeader) is sticky h-[70px]; offset by 70px + 16px gap so
            the panel never tucks under it, and cap height to remaining viewport. */}
        <div className="sticky top-[86px] flex max-h-[calc(100vh-102px)] flex-col overflow-y-auto overflow-x-hidden rounded-3xl border border-default-100 bg-white/95 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="border-b border-default-100 p-5">{headerInner}</div>
          <div className="flex flex-col gap-5 p-5">{fields}</div>
          <div className="sticky bottom-0 mt-auto border-t border-default-100 bg-white/95 p-4 backdrop-blur">
            {applyButton}
          </div>
        </div>
      </aside>

      {/* Mobile/tablet: floating trigger that opens the same panel as a bottom sheet. */}
      <Button
        onPress={onOpen}
        color="primary"
        radius="full"
        startContent={<LuSlidersHorizontal size={16} />}
        className="fixed bottom-6 right-4 z-40 font-semibold shadow-lg shadow-primary/30 lg:hidden"
      >
        Filters
        {activeCount > 0 && (
          <Chip
            size="sm"
            variant="solid"
            className="h-5 min-w-5 bg-white/25 text-[10px] font-semibold text-white"
          >
            {activeCount}
          </Chip>
        )}
      </Button>

      {/* lg:hidden so the sheet never co-exists with the desktop sidebar. */}
      <div className="lg:hidden">{sheet}</div>
    </>
  );
};

export default DiscoverFilters;
