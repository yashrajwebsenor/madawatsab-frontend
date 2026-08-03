import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { MetadataTypes } from "@/app/types/enum";
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteProps,
  Spinner,
} from "@heroui/react";
import { useEffect, useState } from "react";

type Option = {
  _id: string;
  name: string;
  // Prettier text to show in place of `name` when the two differ (a language's
  // native script, say). Only `name` is ever selected or stored.
  label?: string;
};

const displayOf = (option: Option) => option.label || option.name;

// React's own `Key` allows bigint, which react-aria's does not.
type SelectionKey = Parameters<
  NonNullable<AutocompleteProps["onSelectionChange"]>
>[0];

interface Props extends Omit<AutocompleteProps, "children"> {
  metadataType: MetadataTypes;
}

// Prefixes the "use what I typed" row so its key can never collide with a real
// metadata name.
const CUSTOM_KEY_PREFIX = "custom:";

const MetadataDropdown = ({
  metadataType,
  allowsCustomValue,
  selectedKey,
  onSelectionChange,
  ...props
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [debounceTime, setDebounceTime] = useState<any>(null);

  const value = selectedKey ? String(selectedKey) : "";
  const [inputValue, setInputValue] = useState(value);

  // Re-syncs the input when the form value is set from outside (profile load,
  // reset after save). Typing only moves `inputValue`, so this does not fight
  // the user mid-keystroke.
  useEffect(() => {
    if (allowsCustomValue) setInputValue(value);
  }, [value, allowsCustomValue]);

  const fetchOptions = async (search?: string) => {
    try {
      setLoading(true);
      const res = await api.get(ENDPOINTS.CONFIGS.METADATA_LIST(metadataType), {
        params: {
          search,
          page: 1,
          limit: 1000,
        },
      });
      setOptions(res?.data ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [metadataType]);

  const handleSearch = (search: string) => {
    if (debounceTime) {
      clearTimeout(debounceTime);
    }

    const isSelection = options.some(
      (opt) => opt.name === search || displayOf(opt) === search,
    );
    if (isSelection) return;

    setDebounceTime(
      setTimeout(() => {
        fetchOptions(search.trim());
      }, 1500),
    );
  };

  const handleInputChange = (next: string) => {
    if (allowsCustomValue) {
      setInputValue(next);
      // Commits as the user types, so a value outside the list sticks without
      // needing an explicit pick.
      onSelectionChange?.(next.trim());
    }

    handleSearch(next);
  };

  const handleSelectionChange = (key: SelectionKey) => {
    if (!allowsCustomValue) {
      onSelectionChange?.(key);
      return;
    }

    // Blur with unmatched text reports null; the typed value already won.
    if (key === null) return;

    // With inputValue and selectedKey both controlled, react-aria leaves the
    // input alone on selection and expects us to write the choice back.
    const name = String(key).startsWith(CUSTOM_KEY_PREFIX)
      ? String(key).slice(CUSTOM_KEY_PREFIX.length)
      : String(key);

    setInputValue(name);
    onSelectionChange?.(name);
  };

  const typed = inputValue.trim();
  const matched = options.find(
    (opt) =>
      opt.name.toLowerCase() === typed.toLowerCase() ||
      displayOf(opt).toLowerCase() === typed.toLowerCase(),
  );
  const showCustomRow = !!allowsCustomValue && !!typed && !matched;

  return (
    <Autocomplete
      {...props}
      allowsCustomValue={allowsCustomValue}
      selectedKey={allowsCustomValue ? (matched?.name ?? null) : selectedKey}
      onSelectionChange={handleSelectionChange}
      endContent={loading && <Spinner size="sm" />}
      onInputChange={handleInputChange}
      {...(allowsCustomValue ? { inputValue } : {})}
    >
      {[
        ...(showCustomRow
          ? [
              <AutocompleteItem
                key={`${CUSTOM_KEY_PREFIX}${typed}`}
                textValue={typed}
                className="text-primary"
              >
                Use &quot;{typed}&quot;
              </AutocompleteItem>,
            ]
          : []),
        ...options.map((item) => (
          // Keyed by `name` — that is what gets stored — while showing `label`.
          <AutocompleteItem key={item.name} textValue={displayOf(item)}>
            {displayOf(item)}
          </AutocompleteItem>
        )),
      ]}
    </Autocomplete>
  );
};

export default MetadataDropdown;
