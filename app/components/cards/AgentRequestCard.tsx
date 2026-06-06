import { addToast, Avatar, Button, Card, CardBody } from "@heroui/react";
import { FiMail, FiPhone, FiUser } from "react-icons/fi";
import { User } from "@/app/types/types";
import CommonUtils from "@/app/utils/common.utils";
import { useState } from "react";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";

type Props = {
  refetch: () => void;
  agent: User & { isRequestSent: boolean };
};

const AgentRequestCard = ({ agent, refetch }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    try {
      setLoading(true);
      await api.post(ENDPOINTS.AGENTS.REQUEST, {
        agentId: agent?._id,
      });
      addToast({
        title: "Request sent",
        color: "success",
        description: "Your request has been sent to the agent",
      });
      refetch();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none bg-gradient-to-br from-default-50 to-default-100 dark:from-default-100 dark:to-default-50 shadow-md hover:shadow-lg transition-all duration-300 group">
      <CardBody className="p-5">
        <div className="flex items-start gap-4">
          <Avatar
            src={agent.photos?.[0]?.url}
            name={agent.fullName}
            className="w-14 h-14 text-lg border-2 border-primary/20 shadow-inner"
            isBordered
            color="primary"
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-col mb-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-lg tracking-tight truncate group-hover:text-primary transition-colors">
                  {agent.fullName}
                </h4>
              </div>
              {agent?.isRequestSent && (
                <span className="text-[10px] uppercase tracking-widest text-default-400 font-bold">
                  Request Sent
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-default-200/30 group-hover:bg-default-200/50 transition-colors">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <FiMail size={14} />
                </div>
                <span className="text-xs font-medium truncate text-default-600">
                  {CommonUtils.maskEmail(agent?.email!)}
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg bg-default-200/30 group-hover:bg-default-200/50 transition-colors">
                <div className="p-1.5 rounded-md bg-secondary/10 text-secondary">
                  <FiPhone size={14} />
                </div>
                <span className="text-xs font-medium text-default-600">
                  {CommonUtils.maskPhone(agent?.mobile!)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!agent?.isRequestSent && (
          <div className="mt-5 flex gap-3 w-full justify-center">
            <Button
              fullWidth
              color="primary"
              isLoading={loading}
              onPress={handleRequest}
              startContent={<FiUser className="animate-bounce" />}
              className="font-bold tracking-wide"
            >
              Request Now
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default AgentRequestCard;
