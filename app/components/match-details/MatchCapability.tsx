import useUserStore from "@/app/store/useUserStore";
import { User } from "@/app/types/types";
import {
  calculateMatchCompatibility,
  CompatibilityDimension,
} from "@/app/utils/match-compatibility";
import { Chip, Progress } from "@heroui/react";
import { useMemo } from "react";

const scoreColorClass = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-primary";
  if (score >= 45) return "text-warning";
  return "text-danger";
};

const progressColorClass = (score: number) => {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-primary";
  if (score >= 45) return "bg-warning";
  return "bg-danger";
};

const DimensionRow = ({ dimension }: { dimension: CompatibilityDimension }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-end gap-4">
      <span className="text-xs text-gray-500 font-medium">{dimension.label}</span>
      <span className={`text-xs font-bold ${scoreColorClass(dimension.score)}`}>
        {dimension.score}% Match
      </span>
    </div>
    <Progress
      value={dimension.score}
      className="h-1.5"
      classNames={{
        indicator: progressColorClass(dimension.score),
        track: "bg-gray-100",
      }}
    />
  </div>
);

const MatchCapability = ({ profile }: { profile: User }) => {
  const { user } = useUserStore();

  const compatibility = useMemo(
    () => calculateMatchCompatibility(user, profile),
    [profile, user],
  );

  if (!compatibility) {
    return (
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 h-full">
        <h2 className="text-xl font-bold text-gray-900">Match Compatibility</h2>
        <p className="text-sm text-center text-gray-500 max-w-[300px]">
          We need more completed profile details from both sides before a
          compatibility score can be calculated.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col gap-6 lg:flex-1 lg:overflow-y-auto lg:pr-2 lg:scrollbar-subtle lg:overscroll-contain">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Match Compatibility
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Based on {compatibility.dataPoints} shared profile signals
            </p>
          </div>
          <Chip
            size="sm"
            variant="flat"
            color={
              compatibility.overallScore >= 80
                ? "success"
                : compatibility.overallScore >= 60
                  ? "primary"
                  : compatibility.overallScore >= 45
                    ? "warning"
                    : "danger"
            }
            className="font-semibold"
          >
            {compatibility.label}
          </Chip>
        </div>

        <div className="text-center">
          <h3 className="text-5xl font-black text-primary">
            {compatibility.overallScore}%
          </h3>
          <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] mt-1 uppercase">
            {compatibility.label} Match
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 leading-relaxed max-w-[320px] mx-auto">
          {compatibility.summary}
        </p>

        {compatibility.reasons.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {compatibility.reasons.map((reason) => (
              <Chip key={reason} size="sm" variant="flat" color="primary">
                {reason}
              </Chip>
            ))}
          </div>
        )}

        <div className="w-full flex flex-col gap-5 mt-1">
          {compatibility.dimensions.map((dimension) => (
            <DimensionRow key={dimension.key} dimension={dimension} />
          ))}
        </div>

        <p className="text-[11px] text-gray-400 text-center pt-1">
          Confidence {compatibility.confidence}% based on the profile details
          both sides have filled in.
        </p>
      </div>
    </div>
  );
};

export default MatchCapability;
