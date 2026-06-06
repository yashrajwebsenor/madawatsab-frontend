import OnboardingStepper from "./OnboardingStepper";

type Props = {
  step: number;
};

const OnboardingHeader = ({ step }: Props) => {
  return (
    <div className="max-w-sm w-full mx-auto">
      <OnboardingStepper activeStep={step} steps={7} />
    </div>
  );
};

export default OnboardingHeader;
