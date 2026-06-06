import { User } from "../types/types";

type CompatibilityDimensionKey =
  | "faith"
  | "location"
  | "life_stage"
  | "career"
  | "family"
  | "physical";

export interface CompatibilityDimension {
  key: CompatibilityDimensionKey;
  label: string;
  score: number;
  weight: number;
}

export interface MatchCompatibility {
  overallScore: number;
  label: string;
  confidence: number;
  dataPoints: number;
  summary: string;
  reasons: string[];
  dimensions: CompatibilityDimension[];
}

type ScoreContribution = {
  dimension: CompatibilityDimensionKey;
  label: string;
  score: number;
  weight: number;
  reason?: string;
};

const DIMENSIONS: Record<
  CompatibilityDimensionKey,
  { label: string; order: number }
> = {
  faith: { label: "Faith & Background", order: 1 },
  location: { label: "Location & Language", order: 2 },
  life_stage: { label: "Life Stage", order: 3 },
  career: { label: "Education & Career", order: 4 },
  family: { label: "Family Setup", order: 5 },
  physical: { label: "Physical Compatibility", order: 6 },
};

const TOTAL_POSSIBLE_WEIGHT = 100;

const round = (value: number) => Math.round(value);

const normalize = (value?: string | null) =>
  value?.trim().toLowerCase().replace(/\s+/g, " ") || "";

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getFirstName = (name?: string) => {
  const first = name?.trim().split(/\s+/)[0] || "This member";
  return titleCase(first);
};

const getAge = (dob?: string) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const tokenizeList = (value?: string) =>
  normalize(value)
    .split(/[,/&]| and /)
    .map((item) => item.trim())
    .filter(Boolean);

const parseIncomeToLakhs = (value?: string) => {
  const normalized = normalize(value);
  if (!normalized) return null;

  const compact = normalized.replace(/_/g, " ");

  if (compact.includes("under 3 lakh")) return 2;
  if (compact.includes("3 to 5 lakh")) return 4;
  if (compact.includes("5 to 10 lakh")) return 7.5;
  if (compact.includes("10 to 15 lakh")) return 12.5;
  if (compact.includes("15 to 25 lakh")) return 20;
  if (compact.includes("25 to 50 lakh")) return 37.5;
  if (compact.includes("50 to 75 lakh")) return 62.5;
  if (compact.includes("75 lakh to 1 crore")) return 87.5;
  if (compact.includes("above 1 crore")) return 125;

  const numbers = compact.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (numbers.length === 0) return null;

  const multiplier = compact.includes("cr") || compact.includes("crore") ? 100 : 1;
  if (numbers.length === 1) return numbers[0] * multiplier;

  const average = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  return average * multiplier;
};

const qualificationLevel = (value?: string) => {
  const normalized = normalize(value);
  if (!normalized) return null;
  if (normalized.includes("phd") || normalized.includes("doctorate")) return 5;
  if (normalized.includes("master")) return 4;
  if (
    normalized.includes("bachelor") ||
    normalized.includes("b.tech") ||
    normalized.includes("btech") ||
    normalized.includes("b.e") ||
    normalized.includes("ba ") ||
    normalized.includes("bsc") ||
    normalized.includes("b.com") ||
    normalized.includes("llb")
  ) {
    return 3;
  }
  if (normalized.includes("undergrad")) return 2;
  if (normalized.includes("diploma")) return 1;
  if (normalized.includes("scholar")) return 3;
  return null;
};

const scoreLocation = (viewer: User, target: User): ScoreContribution | null => {
  const viewerAddress = viewer.address;
  const targetAddress = target.address;
  if (!viewerAddress || !targetAddress) return null;

  if (viewerAddress.cityId && viewerAddress.cityId === targetAddress.cityId) {
    return {
      dimension: "location",
      label: "location",
      score: 100,
      weight: 12,
      reason: "You both are based in the same city.",
    };
  }

  if (viewerAddress.stateId && viewerAddress.stateId === targetAddress.stateId) {
    return {
      dimension: "location",
      label: "location",
      score: 74,
      weight: 12,
      reason: "You share the same state, which keeps families and travel closer.",
    };
  }

  if (
    viewerAddress.countryId &&
    viewerAddress.countryId === targetAddress.countryId
  ) {
    return {
      dimension: "location",
      label: "location",
      score: 48,
      weight: 12,
      reason: "You are in the same country, but not in the same state.",
    };
  }

  return {
    dimension: "location",
    label: "location",
    score: 24,
    weight: 12,
  };
};

const scoreLanguage = (viewer: User, target: User): ScoreContribution | null => {
  const viewerLanguages = tokenizeList(viewer.language);
  const targetLanguages = tokenizeList(target.language);
  if (viewerLanguages.length === 0 || targetLanguages.length === 0) return null;

  const overlap = viewerLanguages.filter((language) =>
    targetLanguages.includes(language),
  );

  if (overlap.length === 0) {
    return {
      dimension: "location",
      label: "language",
      score: 28,
      weight: 6,
    };
  }

  const exact =
    viewerLanguages.length === targetLanguages.length &&
    viewerLanguages.every((language) => targetLanguages.includes(language));

  return {
    dimension: "location",
    label: "language",
    score: exact ? 100 : 82,
    weight: 6,
    reason: `You share ${overlap[0]} as a spoken language.`,
  };
};

const scoreSect = (viewer: User, target: User): ScoreContribution | null => {
  const viewerSect = normalize(viewer.sect);
  const targetSect = normalize(target.sect);
  if (!viewerSect || !targetSect) return null;

  return {
    dimension: "faith",
    label: "sect",
    score: viewerSect === targetSect ? 100 : 28,
    weight: 10,
    reason:
      viewerSect === targetSect ? `You both identify as ${viewerSect}.` : undefined,
  };
};

const scoreMaslak = (viewer: User, target: User): ScoreContribution | null => {
  const viewerMaslak = normalize(viewer.maslak);
  const targetMaslak = normalize(target.maslak);
  if (!viewerMaslak || !targetMaslak) return null;

  let score = 35;
  if (viewerMaslak === targetMaslak) score = 100;
  else if (normalize(viewer.sect) === normalize(target.sect)) score = 58;

  return {
    dimension: "faith",
    label: "maslak",
    score,
    weight: 8,
    reason:
      viewerMaslak === targetMaslak
        ? `You follow the same maslak: ${viewerMaslak}.`
        : undefined,
  };
};

const scoreCommunity = (viewer: User, target: User): ScoreContribution | null => {
  const viewerCommunity = normalize(viewer.community);
  const targetCommunity = normalize(target.community);
  if (!viewerCommunity || !targetCommunity) return null;

  return {
    dimension: "faith",
    label: "community",
    score: viewerCommunity === targetCommunity ? 100 : 40,
    weight: 8,
    reason:
      viewerCommunity === targetCommunity
        ? `You come from the same community background.`
        : undefined,
  };
};

const scoreMaritalStatus = (
  viewer: User,
  target: User,
): ScoreContribution | null => {
  const viewerStatus = normalize(viewer.maritalStatus);
  const targetStatus = normalize(target.maritalStatus);
  if (!viewerStatus || !targetStatus) return null;

  let score = 35;
  if (viewerStatus === targetStatus) score = 100;
  else if (
    ["divorced", "widowed"].includes(viewerStatus) &&
    ["divorced", "widowed"].includes(targetStatus)
  ) {
    score = 72;
  }

  return {
    dimension: "life_stage",
    label: "marital status",
    score,
    weight: 8,
    reason:
      viewerStatus === targetStatus
        ? `You are both in the same marital stage.`
        : undefined,
  };
};

const scoreAge = (viewer: User, target: User): ScoreContribution | null => {
  const viewerAge = getAge(viewer.dob);
  const targetAge = getAge(target.dob);
  if (viewerAge == null || targetAge == null) return null;

  const viewerGender = normalize(viewer.gender);
  const targetGender = normalize(target.gender);
  const difference = targetAge - viewerAge;
  const absoluteDifference = Math.abs(difference);

  let score = 50;

  if (viewerGender === "female" && targetGender === "male") {
    if (difference >= 1 && difference <= 6) score = 100;
    else if (difference === 0) score = 86;
    else if (difference >= 7 && difference <= 10) score = 72;
    else if (difference < 0 && absoluteDifference <= 2) score = 58;
    else if (difference < 0) score = 28;
    else score = 44;
  } else if (viewerGender === "male" && targetGender === "female") {
    if (difference <= -1 && difference >= -6) score = 100;
    else if (difference === 0) score = 86;
    else if (difference <= -7 && difference >= -10) score = 72;
    else if (difference > 0 && absoluteDifference <= 2) score = 58;
    else if (difference > 0) score = 28;
    else score = 44;
  } else {
    if (absoluteDifference <= 2) score = 100;
    else if (absoluteDifference <= 5) score = 82;
    else if (absoluteDifference <= 8) score = 62;
    else if (absoluteDifference <= 12) score = 40;
    else score = 24;
  }

  return {
    dimension: "life_stage",
    label: "age",
    score,
    weight: 10,
    reason:
      score >= 80 ? `Your age gap falls in a comfortable range.` : undefined,
  };
};

const scoreHeight = (viewer: User, target: User): ScoreContribution | null => {
  if (!viewer.height || !target.height) return null;

  const viewerGender = normalize(viewer.gender);
  const targetGender = normalize(target.gender);
  const difference = target.height - viewer.height;
  const absoluteDifference = Math.abs(difference);

  let score = 52;

  if (viewerGender === "female" && targetGender === "male") {
    if (difference >= 5 && difference <= 10) score = 100;
    else if (difference >= 3 && difference <= 12) score = 88;
    else if (difference >= 1 && difference <= 15) score = 72;
    else if (difference < 0) score = 18;
    else if (difference <= 20) score = 54;
    else score = 26;
  } else if (viewerGender === "male" && targetGender === "female") {
    if (difference <= -5 && difference >= -10) score = 100;
    else if (difference <= -3 && difference >= -12) score = 88;
    else if (difference <= -1 && difference >= -15) score = 72;
    else if (difference > 0) score = 18;
    else if (absoluteDifference <= 20) score = 54;
    else score = 26;
  } else {
    if (absoluteDifference <= 4) score = 90;
    else if (absoluteDifference <= 8) score = 74;
    else if (absoluteDifference <= 12) score = 56;
    else score = 32;
  }

  return {
    dimension: "physical",
    label: "height",
    score,
    weight: 15,
    reason:
      score >= 80 ? `Your height difference sits in a natural range.` : undefined,
  };
};

const scoreQualification = (
  viewer: User,
  target: User,
): ScoreContribution | null => {
  const viewerQualification = normalize(viewer.qualification);
  const targetQualification = normalize(target.qualification);
  if (!viewerQualification || !targetQualification) return null;

  if (viewerQualification === targetQualification) {
    return {
      dimension: "career",
      label: "qualification",
      score: 100,
      weight: 5,
      reason: "Your education level matches closely.",
    };
  }

  const viewerLevel = qualificationLevel(viewer.qualification);
  const targetLevel = qualificationLevel(target.qualification);
  if (viewerLevel != null && targetLevel != null) {
    const gap = Math.abs(viewerLevel - targetLevel);
    return {
      dimension: "career",
      label: "qualification",
      score: gap === 0 ? 100 : gap === 1 ? 84 : gap === 2 ? 64 : 42,
      weight: 5,
    };
  }

  return {
    dimension: "career",
    label: "qualification",
    score: 58,
    weight: 5,
  };
};

const scoreWorkSector = (viewer: User, target: User): ScoreContribution | null => {
  const viewerSector = normalize(viewer.workSector);
  const targetSector = normalize(target.workSector);
  if (!viewerSector || !targetSector) return null;

  return {
    dimension: "career",
    label: "work sector",
    score: viewerSector === targetSector ? 100 : 56,
    weight: 4,
    reason:
      viewerSector === targetSector
        ? "You are both in a similar work sector."
        : undefined,
  };
};

const scoreOccupation = (viewer: User, target: User): ScoreContribution | null => {
  const viewerOccupation = normalize(viewer.occupation);
  const targetOccupation = normalize(target.occupation);
  if (!viewerOccupation || !targetOccupation) return null;

  return {
    dimension: "career",
    label: "occupation",
    score: viewerOccupation === targetOccupation ? 100 : 52,
    weight: 2,
  };
};

const scoreIncome = (viewer: User, target: User): ScoreContribution | null => {
  const viewerIncome = parseIncomeToLakhs(viewer.annualIncome);
  const targetIncome = parseIncomeToLakhs(target.annualIncome);
  if (viewerIncome == null || targetIncome == null) return null;

  const ratio =
    Math.max(viewerIncome, targetIncome) / Math.max(1, Math.min(viewerIncome, targetIncome));

  let score = 42;
  if (ratio <= 1.15) score = 100;
  else if (ratio <= 1.5) score = 82;
  else if (ratio <= 2) score = 64;
  else score = 42;

  return {
    dimension: "career",
    label: "annual income",
    score,
    weight: 4,
  };
};

const familyTypeCompatibility: Record<string, Record<string, number>> = {
  joint: { joint: 100, extended: 84, nuclear: 58, single: 48, blended: 56 },
  extended: { extended: 100, joint: 84, nuclear: 58, single: 48, blended: 56 },
  nuclear: { nuclear: 100, single: 84, blended: 70, joint: 58, extended: 58 },
  single: { single: 100, nuclear: 84, blended: 68, joint: 48, extended: 48 },
  blended: { blended: 100, nuclear: 70, single: 68, joint: 56, extended: 56 },
};

const scoreFamilyType = (viewer: User, target: User): ScoreContribution | null => {
  const viewerType = normalize(viewer.family?.familyType);
  const targetType = normalize(target.family?.familyType);
  if (!viewerType || !targetType) return null;

  const score = familyTypeCompatibility[viewerType]?.[targetType] ?? 55;
  return {
    dimension: "family",
    label: "family type",
    score,
    weight: 5,
    reason:
      score >= 80 ? "Your family structures are very similar." : undefined,
  };
};

const scoreFamilyLiving = (viewer: User, target: User): ScoreContribution | null => {
  if (
    typeof viewer.isFamilyLivingWithUser !== "boolean" ||
    typeof target.isFamilyLivingWithUser !== "boolean"
  ) {
    return null;
  }

  return {
    dimension: "family",
    label: "family living setup",
    score:
      viewer.isFamilyLivingWithUser === target.isFamilyLivingWithUser ? 100 : 58,
    weight: 3,
  };
};

const buildSummary = (
  profileName: string,
  dimensions: CompatibilityDimension[],
  reasons: string[],
) => {
  if (dimensions.length === 0) {
    return `Compatibility will appear once both profiles have more comparable details filled in.`;
  }

  const topDimensions = [...dimensions]
    .sort((a, b) => b.score - a.score || b.weight - a.weight)
    .slice(0, 3)
    .map((dimension) => dimension.label);

  const dimensionSummary =
    topDimensions.length === 1
      ? topDimensions[0]
      : `${topDimensions.slice(0, -1).join(", ")} and ${topDimensions.at(-1)}`;

  if (reasons.length > 0) {
    return `${profileName} aligns best with you on ${dimensionSummary}.`;
  }

  return `${profileName} shows the strongest alignment on ${dimensionSummary}.`;
};

const getCompatibilityLabel = (score: number) => {
  if (score >= 85) return "Excellent";
  if (score >= 72) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 45) return "Fair";
  return "Low";
};

export const calculateMatchCompatibility = (
  viewer?: User | null,
  target?: User | null,
): MatchCompatibility | null => {
  if (!viewer || !target) return null;

  // Optional fields only participate when both profiles actually provide that
  // detail. If either side leaves a field blank, that factor is excluded from
  // both the score numerator and denominator.
  const contributions = [
    scoreSect(viewer, target),
    scoreMaslak(viewer, target),
    scoreCommunity(viewer, target),
    scoreLocation(viewer, target),
    scoreLanguage(viewer, target),
    scoreMaritalStatus(viewer, target),
    scoreAge(viewer, target),
    scoreQualification(viewer, target),
    scoreWorkSector(viewer, target),
    scoreOccupation(viewer, target),
    scoreIncome(viewer, target),
    scoreFamilyType(viewer, target),
    scoreFamilyLiving(viewer, target),
    scoreHeight(viewer, target),
  ].filter(Boolean) as ScoreContribution[];

  if (contributions.length === 0) return null;

  const dimensionScores = (Object.keys(DIMENSIONS) as CompatibilityDimensionKey[])
    .map((dimensionKey) => {
      const items = contributions.filter((item) => item.dimension === dimensionKey);
      if (items.length === 0) return null;

      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      const weightedScore =
        items.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;

      return {
        key: dimensionKey,
        label: DIMENSIONS[dimensionKey].label,
        score: round(weightedScore),
        weight: totalWeight,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        DIMENSIONS[a!.key].order - DIMENSIONS[b!.key].order,
    ) as CompatibilityDimension[];

  const totalActiveWeight = contributions.reduce((sum, item) => sum + item.weight, 0);
  const overallScore = round(
    contributions.reduce((sum, item) => sum + item.score * item.weight, 0) /
      totalActiveWeight,
  );
  const confidence = round(
    (totalActiveWeight / TOTAL_POSSIBLE_WEIGHT) * 100,
  );

  const reasons = contributions
    .filter((item) => item.reason && item.score >= 80)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .slice(0, 3)
    .map((item) => item.reason!) ;

  return {
    overallScore,
    label: getCompatibilityLabel(overallScore),
    confidence,
    dataPoints: contributions.length,
    summary: buildSummary(getFirstName(target.fullName), dimensionScores, reasons),
    reasons,
    dimensions: dimensionScores,
  };
};
