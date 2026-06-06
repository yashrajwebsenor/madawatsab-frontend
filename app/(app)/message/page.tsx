"use client";

import ChatListSection from "@/app/components/chat/ChatListSection";
import { Card } from "@heroui/react";
import { LuMessageCircle } from "react-icons/lu";

const page = () => {
  return (
    <div className="flex gap-5 container py-5 h-[calc(100vh-70px)] relative">
      <ChatListSection />

      <Card
        shadow="sm"
        className="hidden sm:flex flex-1 border-none p-3 h-full overflow-hidden relative"
      >
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
          <div className="p-6 rounded-full bg-primary/5 text-primary animate-pulse">
            <LuMessageCircle size={48} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-800">Select a chat</h3>
            <p className="text-gray-500 max-w-[320px] text-sm leading-relaxed">
              Choose from your existing conversations or start a new one to
              begin messaging.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default page;
