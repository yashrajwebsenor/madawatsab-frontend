import { addToast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/api";
import ENDPOINTS from "../api/endpoints";

// Session-local map of ids the user toggled this session: id -> shortlisted.
// Used as an optimistic overlay on top of the per-card `isShortlisted` flag the
// list/profile APIs now send, so the bookmark icon flips instantly without a
// dedicated shortlist-ids fetch or a full list refetch.
type Overrides = Record<string, boolean>;

const OVERRIDES_KEY = ["shortlist-overrides"];

/**
 * Shared shortlist state. The source of truth is the per-card `isShortlisted`
 * flag sent inline by every profile/list endpoint; this hook only layers an
 * optimistic override for the just-toggled card and owns the toggle mutation.
 *
 * Shortlists are private — only "Shortlisted by Me" exists; the target is
 * never notified.
 */
const useShortlist = () => {
  const queryClient = useQueryClient();

  // No network — a purely client-side store seeded empty and mutated optimistically.
  const { data: overrides } = useQuery<Overrides>({
    queryKey: OVERRIDES_KEY,
    queryFn: () => queryClient.getQueryData<Overrides>(OVERRIDES_KEY) ?? {},
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: {},
  });

  const { mutate: toggleShortlist, isPending: isToggling } = useMutation({
    mutationFn: async (targetId: string) => {
      const res: any = await api.post(ENDPOINTS.SHORTLISTS.TOGGLE, {
        targetId,
      });
      // Backend envelope: `{ status, message, data: { shortlisted } }`. The
      // ResponseInterceptor hoists the service `message` to the top level and
      // nests the payload under `data`, so read both from their real spots.
      return {
        shortlisted: !!res?.data?.shortlisted,
        message: res?.message,
      } as { shortlisted: boolean; message: string };
    },
    // Flip the override optimistically so the bookmark icon responds instantly;
    // roll back on failure.
    onMutate: async (targetId) => {
      await queryClient.cancelQueries({ queryKey: OVERRIDES_KEY });
      const previous =
        queryClient.getQueryData<Overrides>(OVERRIDES_KEY) ?? {};
      const current = previous[targetId] ?? false;
      queryClient.setQueryData<Overrides>(OVERRIDES_KEY, {
        ...previous,
        [targetId]: !current,
      });
      return { previous };
    },
    onError: (_error, _targetId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(OVERRIDES_KEY, context.previous);
      }
    },
    onSuccess: (result, targetId) => {
      // Pin the override to the server's authoritative state.
      queryClient.setQueryData<Overrides>(OVERRIDES_KEY, (old = {}) => ({
        ...old,
        [targetId]: !!result?.shortlisted,
      }));
      addToast({
        color: "success",
        title: result?.shortlisted ? "Shortlisted" : "Removed",
        description:
          result?.message ||
          (result?.shortlisted
            ? "Added to your shortlist"
            : "Removed from your shortlist"),
      });
    },
    onSettled: () => {
      // Refresh feeds so the inline `isShortlisted` flag becomes authoritative
      // (the override stays as a same-value overlay until then).
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: ["activity", "shortlist"] });
    },
  });

  return {
    // Override wins when the user toggled this card this session; otherwise the
    // inline server flag is the source of truth.
    isShortlisted: (targetId?: string, serverValue?: boolean) => {
      if (targetId && overrides && targetId in overrides) {
        return overrides[targetId];
      }
      return !!serverValue;
    },
    toggleShortlist,
    isToggling,
  };
};

export default useShortlist;
