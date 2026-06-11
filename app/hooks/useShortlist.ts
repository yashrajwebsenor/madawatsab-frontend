import { addToast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "../api/api";
import ENDPOINTS from "../api/endpoints";

/**
 * Shared shortlist state: one cached id-set (so every card knows its
 * bookmarked state without per-card requests) + an optimistic toggle.
 *
 * Shortlists are private — only "Shortlisted by Me" exists; the target is
 * never notified.
 */
const useShortlist = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["shortlist-ids"],
    queryFn: async (): Promise<string[]> => {
      const res: any = await api.get(ENDPOINTS.SHORTLISTS.IDS);
      return res?.data ?? [];
    },
  });

  const ids = useMemo(() => new Set(data ?? []), [data]);

  const { mutate: toggleShortlist, isPending: isToggling } = useMutation({
    mutationFn: async (targetId: string) => {
      const res: any = await api.post(ENDPOINTS.SHORTLISTS.TOGGLE, {
        targetId,
      });
      return res as { shortlisted: boolean; message: string };
    },
    // Flip the cached id optimistically so the bookmark icon responds
    // instantly; roll back on failure.
    onMutate: async (targetId) => {
      await queryClient.cancelQueries({ queryKey: ["shortlist-ids"] });
      const previous = queryClient.getQueryData<string[]>(["shortlist-ids"]);
      queryClient.setQueryData<string[]>(["shortlist-ids"], (old = []) =>
        old.includes(targetId)
          ? old.filter((id) => id !== targetId)
          : [...old, targetId],
      );
      return { previous };
    },
    onError: (_error, _targetId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["shortlist-ids"], context.previous);
      }
    },
    onSuccess: (result) => {
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
      queryClient.invalidateQueries({ queryKey: ["shortlist-ids"] });
      // The Shortlisted activity tab must add/drop the toggled card.
      queryClient.invalidateQueries({ queryKey: ["activity", "shortlist"] });
    },
  });

  return {
    isShortlisted: (targetId?: string) => !!targetId && ids.has(targetId),
    toggleShortlist,
    isToggling,
  };
};

export default useShortlist;
