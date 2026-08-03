"use client";

import useCityOffice from "@/app/hooks/useCityOffice";
import { OfficeAgent } from "@/app/types/types";
import { Avatar, Card, CardBody } from "@heroui/react";
import { LuBuilding2, LuClock, LuMapPin, LuPhone } from "react-icons/lu";

type Props = {
  // "compact" is the trimmed version for the header drawer, where vertical
  // space is scarce; "full" is the standalone card used on real pages.
  variant?: "full" | "compact";
  className?: string;
};

const AgentRow = ({
  agent,
  compact,
}: {
  agent: OfficeAgent;
  compact: boolean;
}) => (
  <a
    href={`tel:${agent.mobile}`}
    className="flex items-center gap-3 rounded-xl border border-divider bg-white p-2.5 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
  >
    <Avatar
      size={compact ? "sm" : "md"}
      name={agent.fullName}
      src={agent.profilePhoto?.url}
      className="shrink-0"
    />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-default-800">
        {agent.fullName}
      </p>
      <p className="truncate text-xs text-default-500">{agent.mobile}</p>
    </div>
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold capitalize ${
        agent.gender === "female"
          ? "bg-pink-50 text-pink-600"
          : "bg-blue-50 text-blue-600"
      }`}
    >
      {agent.gender}
    </span>
  </a>
);

/**
 * The Madawat Sab office for the viewer's own city, plus the agents working
 * there. Rendered on My Profile, the header account drawer and Help & Support.
 *
 * Renders nothing at all when the viewer's city has no office (or while
 * loading) — cities are onboarded one at a time, so an empty state would be
 * noise on every screen it appears on.
 */
const CityOfficeCard = ({ variant = "full", className = "" }: Props) => {
  const { office, isLoading } = useCityOffice();

  if (isLoading || !office) return null;

  const compact = variant === "compact";
  const place = [office.cityName, office.stateName].filter(Boolean).join(", ");

  const body = (
    <>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LuBuilding2 size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`font-semibold text-default-800 ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            Our {office.cityName} office
          </h3>
          <p className="mt-0.5 text-xs text-default-500">
            Visit us or talk to the agents for your city.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {office.address && (
          <div className="flex items-start gap-2.5">
            <LuMapPin size={15} className="mt-0.5 shrink-0 text-default-400" />
            <p className="whitespace-pre-line text-sm leading-6 text-default-600">
              {office.address}
            </p>
          </div>
        )}

        {!office.address && place && (
          <div className="flex items-start gap-2.5">
            <LuMapPin size={15} className="mt-0.5 shrink-0 text-default-400" />
            <p className="text-sm leading-6 text-default-600">{place}</p>
          </div>
        )}

        {office.phone && (
          <div className="flex items-center gap-2.5">
            <LuPhone size={15} className="shrink-0 text-default-400" />
            <a
              href={`tel:${office.phone}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {office.phone}
            </a>
          </div>
        )}

        {office.openingHours && (
          <div className="flex items-center gap-2.5">
            <LuClock size={15} className="shrink-0 text-default-400" />
            <p className="text-sm text-default-600">{office.openingHours}</p>
          </div>
        )}
      </div>

      {office.agents.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-default-400">
            {office.agents.length > 1 ? "Your agents" : "Your agent"}
          </p>
          <div className={compact ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}>
            {office.agents.map((agent) => (
              <AgentRow key={agent._id} agent={agent} compact={compact} />
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <div className={`rounded-xl border border-divider p-4 ${className}`}>
        {body}
      </div>
    );
  }

  return (
    <Card
      className={`w-full border-none bg-white shadow-sm rounded-xl ${className}`}
    >
      <CardBody className="p-5">{body}</CardBody>
    </Card>
  );
};

export default CityOfficeCard;
