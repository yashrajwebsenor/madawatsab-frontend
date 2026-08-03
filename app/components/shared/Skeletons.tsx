import { Card, Skeleton } from "@heroui/react";

/**
 * Skeleton placeholders that mirror the real layouts so async content swaps in
 * without layout shift (CLS). Use these instead of a centered spinner for any
 * data-driven list/grid/detail view.
 */

// Single match card placeholder — mirrors MatchCard (image + name + chips).
export const MatchCardSkeleton = () => (
  <Card shadow="none" radius="none" className="border-none bg-white h-full">
    <Skeleton className="rounded-none">
      <div className="aspect-[3/4] w-full" />
    </Skeleton>
    <div className="p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-20 rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  </Card>
);

// Grid of match cards — home discovery, connections, interest lists.
export const MatchGridSkeleton = ({
  count = 6,
  className = "grid gap-5 sm:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, i) => (
      <MatchCardSkeleton key={i} />
    ))}
  </div>
);

// Single pricing card placeholder — mirrors PriceCard.
export const PriceCardSkeleton = () => (
  <Card shadow="none" className="border border-default-100 p-6">
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-24 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
      <div className="flex flex-col gap-2 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-full mt-3" />
    </div>
  </Card>
);

// Grid of pricing cards.
export const PriceGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
    {Array.from({ length: count }).map((_, i) => (
      <PriceCardSkeleton key={i} />
    ))}
  </div>
);

// One chat list row placeholder — mirrors ChatListCard.
export const ChatRowSkeleton = () => (
  <div className="flex items-center gap-3 px-3 py-2">
    <Skeleton className="flex rounded-full w-10 h-10 shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-28 rounded-lg" />
        <Skeleton className="h-2 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-2.5 w-40 rounded-lg" />
    </div>
  </div>
);

// Stack of chat list rows.
export const ChatListSkeleton = ({ count = 7 }: { count?: number }) => (
  <div className="flex flex-col py-1 gap-1">
    {Array.from({ length: count }).map((_, i) => (
      <ChatRowSkeleton key={i} />
    ))}
  </div>
);

// One message-search result row — name + date line, then a snippet line.
export const MessageSearchRowSkeleton = () => (
  <div className="flex flex-col gap-2 px-4 py-3">
    <div className="flex justify-between">
      <Skeleton className="h-3 w-24 rounded-lg" />
      <Skeleton className="h-2.5 w-16 rounded-lg" />
    </div>
    <Skeleton className="h-2.5 w-full rounded-lg" />
  </div>
);

// Stack of search-result rows — shown while a chat search is in flight.
export const MessageSearchSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="flex flex-col divide-y divide-gray-100">
    {Array.from({ length: count }).map((_, i) => (
      <MessageSearchRowSkeleton key={i} />
    ))}
  </div>
);

// Generic stacked-card placeholder — agent lists, drawers, simple feeds.
export const CardListSkeleton = ({
  count = 4,
  rowClassName = "h-24 w-full rounded-2xl",
}: {
  count?: number;
  rowClassName?: string;
}) => (
  <div className="grid gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className={rowClassName} />
    ))}
  </div>
);

// Form fields placeholder — profile/onboarding sections that load saved data.
export const FormSkeleton = ({ fields = 6 }: { fields?: number }) => (
  <div className="grid items-center sm:grid-cols-2 gap-5 w-full">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    ))}
  </div>
);

// Photo gallery grid placeholder — mirrors ProfilePhotoSection (4:5 tiles).
export const PhotoGridSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid sm:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="w-full aspect-[4/5] rounded-none" />
    ))}
  </div>
);

// Match detail page placeholder — profile section + side insight panel.
export const MatchDetailSkeleton = () => (
  <div className="flex flex-col lg:flex-row lg:items-start gap-8">
    <div className="lg:flex-[2] lg:min-w-0">
      <div className="bg-white overflow-hidden shadow-sm flex flex-col md:flex-row w-full border border-gray-100 lg:h-[580px]">
        <Skeleton className="w-full md:w-[350px] lg:w-[360px] h-[400px] md:h-auto md:self-stretch rounded-none" />
        <div className="flex-1 p-8 lg:p-10 flex flex-col gap-5">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl mt-auto" />
        </div>
      </div>
    </div>
    <div className="lg:flex-1 lg:min-w-0 lg:h-[580px]">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-6 h-full">
        <Skeleton className="h-6 w-44 rounded-lg" />
        <Skeleton className="h-16 w-24 rounded-lg mx-auto" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <div className="flex flex-col gap-5 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24 rounded-lg" />
                <Skeleton className="h-3 w-12 rounded-lg" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
