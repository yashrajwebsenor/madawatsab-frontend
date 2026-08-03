import { useQuery } from "@tanstack/react-query";
import api from "../api/api";
import ENDPOINTS from "../api/endpoints";
import { Office } from "../types/types";

/**
 * The office of the viewer's own city, with the agents who staff it.
 *
 * The city is resolved server-side from the user's saved address — nothing is
 * passed from the client. Cities without an office return `null`, which every
 * consumer renders as "nothing at all" rather than an empty state.
 */
const useCityOffice = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["city-office"],
    queryFn: async () => {
      const res = (await api.get(ENDPOINTS.OFFICE.MY_CITY)) as unknown as {
        data: Office | null;
      };
      return res?.data ?? null;
    },
  });

  return { office: data ?? null, isLoading };
};

export default useCityOffice;
