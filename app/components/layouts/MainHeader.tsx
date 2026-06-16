"use client";

import APP_CONFIG from "@/app/configs/app-config";
import Image from "next/image";
import HeaderMenu from "../shared/HeaderMenu";
import UserMenu from "../shared/UserMenu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Avatar,
  useDisclosure,
  Button,
} from "@heroui/react";
import { FiMenu } from "react-icons/fi";
import { LuX, LuUser, LuLifeBuoy, LuUserX, LuLogOut } from "react-icons/lu";
import type { PanInfo, Variants } from "framer-motion";
import Link from "next/link";
import routes from "@/app/configs/route-paths";
import useUserStore from "@/app/store/useUserStore";
import CommonUtils from "@/app/utils/common.utils";

const accountLinks = [
  { key: "profile", label: "My Profile", icon: LuUser, href: routes.profile },
  {
    key: "help",
    label: "Help & Support",
    icon: LuLifeBuoy,
    href: routes.helpSupport,
  },
  {
    key: "blocked",
    label: "Blocked Users",
    icon: LuUserX,
    href: routes.blockedUsers,
  },
];

const MainHeader = () => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const { user } = useUserStore();

  // HeroUI 2.2.29 drawer has no native drag-to-close. Passing `motionProps`
  // REPLACES the default slide variants, so we re-declare the right-slide here
  // and add framer-motion drag on top. Drag right past the threshold → close;
  // otherwise it rubber-bands back to origin.
  const drawerMotionProps = {
    variants: {
      enter: { x: 0, transition: { x: { duration: 0.2, ease: "easeOut" } } },
      exit: { x: "100%", transition: { x: { duration: 0.15, ease: "easeIn" } } },
    } satisfies Variants,
    drag: "x" as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: { left: 0, right: 0.6 },
    dragSnapToOrigin: true,
    onDragEnd: (_: unknown, info: PanInfo) => {
      if (info.offset.x > 120 || info.velocity.x > 600) onClose();
    },
  };

  return (
    <div className="h-[70px] bg-white flex items-center sticky top-0 z-50 border-b">
      <div className="container flex items-center justify-between">
        <Link href={routes.home} className="flex items-center gap-2">
          <Image
            src="/assets/images/logo.png"
            alt="logo"
            width={28}
            height={28}
          />
          <p className="font-semibold text-lg text-primary">
            {APP_CONFIG.APP_NAME}
          </p>
        </Link>

        <div className="hidden sm:flex">
          <HeaderMenu />
        </div>
        <div className="hidden sm:flex">
          <UserMenu />
        </div>

        <div className="md:hidden flex items-center">
          <Button isIconOnly variant="light" onPress={onOpen} aria-label="Open menu">
            <FiMenu size={24} />
          </Button>
        </div>
      </div>

      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="right"
        size="xs"
        hideCloseButton
        motionProps={drawerMotionProps}
      >
        <DrawerContent>
          {(close) => (
            <>
              <DrawerHeader className="flex items-center justify-between border-b px-5 py-4">
                <span className="text-base font-semibold">Menu</span>
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  variant="light"
                  onPress={close}
                  aria-label="Close menu"
                >
                  <LuX size={20} />
                </Button>
              </DrawerHeader>

              <DrawerBody className="gap-0 px-3 py-4">
                {/* Navigation */}
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-default-400">
                  Navigation
                </p>
                <HeaderMenu variant="drawer" onItemClick={close} />

                {/* Account — placed below navigation */}
                <div className="my-4 h-px bg-default-200" />
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-default-400">
                  Account
                </p>

                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                  <Avatar
                    size="sm"
                    radius="full"
                    color="primary"
                    name={user?.fullName}
                    src={user?.profilePhoto?.url}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {user?.fullName || "My Account"}
                    </span>
                    {user?.mobile && (
                      <span className="truncate text-xs text-default-400">
                        {user.mobile}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-1 flex flex-col gap-1">
                  {accountLinks.map(({ key, label, icon: Icon, href }) => (
                    <Link
                      key={key}
                      href={href}
                      onClick={close}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-default-700 transition-colors hover:bg-default-100"
                    >
                      <Icon className="text-lg text-default-500" />
                      {label}
                    </Link>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      close();
                      CommonUtils.logout();
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                  >
                    <LuLogOut className="text-lg" />
                    Log Out
                  </button>
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MainHeader;
