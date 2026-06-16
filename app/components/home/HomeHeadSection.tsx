import { Button, useDisclosure } from "@heroui/react";
import PageHeaderWrapper from "../shared/PageHeaderWrapper";
import { GoPersonAdd } from "react-icons/go";
import AgentRequestDrawer from "./AgentDrawer";
import useUserStore from "@/app/store/useUserStore";

const HomeHeadSection = () => {
  const { user } = useUserStore();
  const { onOpen, isOpen, onOpenChange } = useDisclosure();

  return (
    <PageHeaderWrapper>
      <div className="container flex gap-5 flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-5 flex-col sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <h2 className="text-white text-2xl sm:text-3xl font-semibold">
              Browse <span className="text-secondary">Matches</span>
            </h2>
            <p className="text-gray-300 text-sm mt-1">
              Discover compatible profiles tailored to your preferences and
              values.
              <br />
              Your perfect match is just a click away.
            </p>
          </div>

          {!user?.assignedAgent && (
            <Button
              onPress={onOpen}
              color="secondary"
              variant="bordered"
              className="font-medium"
              startContent={<GoPersonAdd size={20} />}
            >
              Request For Agent
            </Button>
          )}
        </div>
      </div>

      <AgentRequestDrawer isOpen={isOpen} onOpenChange={onOpenChange} />
    </PageHeaderWrapper>
  );
};

export default HomeHeadSection;
