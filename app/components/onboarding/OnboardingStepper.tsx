type Props = {
  steps: number;
  activeStep: number;
};

const OnboardingStepper = ({ steps, activeStep }: Props) => {
  return (
    <div className="relative flex w-full items-center justify-between">
      <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-primary/20" />

      {Array.from({ length: steps }, (_, i) => i + 1).map((step) => {
        const isActive = step === activeStep;
        const isCompleted = step < activeStep;

        return (
          <div
            key={step}
            className="relative z-10 flex items-center justify-center"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${
                isActive
                  ? "bg-primary text-white border-primary border border-secondary"
                  : isCompleted
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-primary border-primary"
              }`}
            >
              <span className="text-sm font-bold">{step}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OnboardingStepper;
