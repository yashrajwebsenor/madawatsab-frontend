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
};

interface Props extends Omit<AutocompleteProps, "children"> {
  metadataType: MetadataTypes;
}

const MetadataDropdown = ({ metadataType, ...props }: Props) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [debounceTime, setDebounceTime] = useState<any>(null);

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

  const handleSearch = (value: string) => {
    if (debounceTime) {
      clearTimeout(debounceTime);
    }

    const isSelection = options.some((opt) => opt.name === value);
    if (isSelection) return;

    setDebounceTime(
      setTimeout(() => {
        fetchOptions(value.trim());
      }, 1500),
    );
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  return (
    <Autocomplete
      {...props}
      endContent={loading && <Spinner size="sm" />}
      onInputChange={handleSearch}
    >
      {options?.map((item) => (
        <AutocompleteItem key={item.name}>{item.name}</AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

export default MetadataDropdown;
