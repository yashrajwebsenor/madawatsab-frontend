import { useQuery } from "@tanstack/react-query";
import api from "../api/api";
import ENDPOINTS from "../api/endpoints";
import { MetadataTypes } from "../types/enum";

type MetadataOption = { title: string; value: string };

/**
 * The full admin-managed list for one metadata type, shaped like the static
 * `{ title, value }` arrays the forms used to import from `configs/data`.
 *
 * For dropdowns that only ever show one choice at a time prefer
 * `MetadataDropdown`, which searches server-side. This hook is for the
 * multi-selects that need every option in hand at once (`languagesKnown`).
 * Cached by react-query, so several fields of the same type share one request.
 */
const useMetadataOptions = (type: MetadataTypes) => {
  const { data, isLoading } = useQuery({
    queryKey: ["metadata", type],
    queryFn: async () => {
      const res = (await api.get(ENDPOINTS.CONFIGS.METADATA_LIST(type), {
        params: { page: 1, limit: 1000 },
      })) as unknown as {
        data: { _id: string; name: string; label?: string }[];
      };

      // `name` is the stored value; `label` is display-only when present.
      return (res?.data ?? []).map((item) => ({
        title: item.label || item.name,
        value: item.name,
      }));
    },
  });

  return { options: (data ?? []) as MetadataOption[], isLoading };
};

export default useMetadataOptions;
