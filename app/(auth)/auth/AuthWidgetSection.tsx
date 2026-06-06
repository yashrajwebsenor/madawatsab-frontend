import AuthWidget from "@/app/components/cards/AuthWidget";
import { authWidgets } from "@/app/configs/data";
import { Button } from "@heroui/react";
import { Fragment } from "react/jsx-runtime";

const AuthWidgetSection = () => {
  return (
    <div>
      <div className="flex gap-7 justify-center">
        {authWidgets.map((item, idx) => (
          <Fragment key={idx}>
            <AuthWidget {...item} />
            {idx !== authWidgets.length - 1 && (
              <div
                className="h-20 w-[2px] bg-primary opacity-50"
                aria-hidden="true"
              />
            )}
          </Fragment>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        By signing in you agree to our{" "}
        <Button
          size="sm"
          color="primary"
          variant="light"
          className="-px-1.5 font-medium"
        >
          Terms & Privacy
        </Button>
      </p>
    </div>
  );
};

export default AuthWidgetSection;
