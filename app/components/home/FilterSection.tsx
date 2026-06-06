import { ReactNode, useEffect, useState } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Chip,
  Input,
  Slider,
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
import { MaritalStatus, MetadataTypes, Sects } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import { languages } from "@/app/configs/data";
import useCountryCityStates from "@/app/hooks/useCountryCityStates";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";

// Keys the backend treats as advanced — only sent when the viewer has an active
// plan with `hasAdvancedFilters`. Everything else is a basic filter.
const ADVANCED_KEYS = [
  "userId",
  "location",
  "qualification",
  "language",
  "annualIncome",
  "workSector",
] as const;

const defaultFilters = {
  // basic
  minAge: "",
  maxAge: "",
  minHeight: "",
  maxHeight: "",
  country: "",
  state: "",
  sect: "",
  maritalStatus: "",
  caste: "",
  // advanced
  userId: "",
  location: "",
  qualification: "",
  language: "",
  annualIncome: "",
  workSector: "",
};

type Filters = typeof defaultFilters;

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

const FilterSection = () => {
  const router = useRouter();
  const { canUseAdvancedFilters } = useSubscriptionAccess();
  const { countries, states, cities, fetchCountries, fetchStates, fetchCities } =
    useCountryCityStates();

  const [filters, setFilters] = useState<Filters>(defaultFilters);

  useEffect(() => {
    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const goPricing = () => router.push("/pricing");

  // Count applied filters (advanced ones only when the viewer can use them).
  const activeCount = Object.entries(filters).filter(([key, value]) => {
    if (!value) return false;
    if (!canUseAdvancedFilters && ADVANCED_KEYS.includes(key as any))
      return false;
    return true;
  }).length;

  const handleReset = () => {
    setFilters(defaultFilters);
    router.push("?");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Cascade: picking a country loads its states and clears any chosen
  // state/city; clearing it (X) resets the whole geo chain.
  const handleCountryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, country: value, state: "", location: "" }));
    if (value) fetchStates(Number(value));
  };

  // Picking a state loads its cities so the City field is populated instead of
  // empty; clearing it resets the city.
  const handleStateChange = (value: string) => {
    setFilters((prev) => ({ ...prev, state: value, location: "" }));
    if (filters.country && value) {
      fetchCities(Number(filters.country), Number(value));
    }
  };

  const handleApply = () => {
    const entries = Object.entries(filters).filter(([key, v]) => {
      if (v === "" || v === null || v === undefined) return false;
      // Drop advanced params entirely when the user can't use them — backend
      // would ignore them anyway, so don't pretend they're applied.
      if (!canUseAdvancedFilters && ADVANCED_KEYS.includes(key as any))
        return false;
      return true;
    });
    const queryString = new URLSearchParams(
      Object.fromEntries(entries),
    ).toString();
    router.push(`?${queryString}`);
  };

  return (
    <aside className="w-[300px] shrink-0">
      {/* Navbar (MainHeader) is sticky h-[70px]; offset by 70px + 16px gap so the
          panel never tucks under it, and cap height to the remaining viewport. */}
      <div className="sticky top-[86px] flex max-h-[calc(100vh-102px)] flex-col overflow-y-auto overflow-x-hidden rounded-3xl border border-default-100 bg-white/95 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur">
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between border-b border-default-100 p-5">
          <div className="flex items-center gap-3">
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
              <p className="text-[11px] text-default-400">Refine your matches</p>
            </div>
          </div>

          <Button
            size="sm"
            color="primary"
            variant="light"
            onPress={handleReset}
            isDisabled={activeCount === 0}
            className="min-w-0 px-2 text-xs font-medium"
          >
            Clear
          </Button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {/* ---- Basic filters (always available) ---- */}
          <SectionTitle icon={<LuUserRound size={13} />} title="Basics" />

          {/* Range sliders grouped into a soft panel */}
          <div className="flex flex-col gap-6 rounded-2xl bg-default-50 p-4">
            <RangeSlider
              label="Age range"
              minValue={18}
              maxValue={70}
              value={[
                Number(filters.minAge) || 18,
                Number(filters.maxAge) || 40,
              ]}
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
              placeholder="Search country"
              selectedKey={filters.country || null}
              onSelectionChange={(key) =>
                handleCountryChange((key as string) ?? "")
              }
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
              isDisabled={!filters.country}
              placeholder={
                filters.country ? "Search state" : "Select country first"
              }
              selectedKey={filters.state || null}
              onSelectionChange={(key) =>
                handleStateChange((key as string) ?? "")
              }
            >
              {states.map((item) => (
                <AutocompleteItem key={String(item.id)}>
                  {item.name}
                </AutocompleteItem>
              ))}
            </Autocomplete>
          </Field>

          <Field label="Sect">
            <Autocomplete
              size="sm"
              variant="bordered"
              radius="lg"
              aria-label="Sect"
              placeholder="All"
              selectedKey={filters.sect || null}
              onSelectionChange={(key) => setField("sect", (key as string) ?? "")}
            >
              {Object.values(Sects).map((item) => (
                <AutocompleteItem key={item}>
                  {CommonUtils.formatTitle(item)}
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
              onSelectionChange={(key) =>
                setField("caste", (key as string) ?? "")
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
              <Field label="User ID">
                <Input
                  size="sm"
                  variant="bordered"
                  radius="lg"
                  placeholder="MADA0001"
                  value={filters.userId}
                  onChange={(ev) =>
                    setField("userId", ev.target.value?.toUpperCase())
                  }
                />
              </Field>

              <Field label="Location (city)">
                <Autocomplete
                  size="sm"
                  variant="bordered"
                  radius="lg"
                  aria-label="City"
                  isDisabled={!filters.state}
                  placeholder={
                    filters.state ? "Search city" : "Select country & state first"
                  }
                  selectedKey={filters.location || null}
                  onSelectionChange={(key) =>
                    setField("location", (key as string) ?? "")
                  }
                >
                  {cities.map((item) => (
                    <AutocompleteItem key={String(item.id)}>
                      {item.name}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </Field>

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
                <Autocomplete
                  size="sm"
                  variant="bordered"
                  radius="lg"
                  aria-label="Language"
                  placeholder="Select language"
                  selectedKey={filters.language || null}
                  onSelectionChange={(key) =>
                    setField("language", (key as string) ?? "")
                  }
                >
                  {languages.map((item) => (
                    <AutocompleteItem key={item.value}>
                      {item.title}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </Field>
            </>
          ) : (
            <>
              <LockedField label="User ID" onUpgrade={goPricing} />
              <LockedField label="Location (city)" onUpgrade={goPricing} />
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
        </div>

        {/* ---- Apply (sticky footer) ---- */}
        <div className="sticky bottom-0 mt-auto border-t border-default-100 bg-white/95 p-4 backdrop-blur">
          <Button
            radius="lg"
            color="primary"
            onPress={handleApply}
            startContent={<LuSearch size={16} />}
            className="w-full font-semibold shadow-lg shadow-primary/30"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default FilterSection;
