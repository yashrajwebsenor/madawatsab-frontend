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
  useDisclosure,
  Button,
} from "@heroui/react";
import { FiMenu } from "react-icons/fi";
import Link from "next/link";
import routes from "@/app/configs/route-paths";

const MainHeader = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
          <Button isIconOnly variant="light" onPress={onOpen}>
            <FiMenu size={24} />
          </Button>
        </div>
      </div>

      <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="right">
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1 border-b">
            Menu
          </DrawerHeader>
          <DrawerBody className="py-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <UserMenu />
                <span className="font-medium text-sm">Account Options</span>
              </div>
              <div className="w-full h-[1px] bg-default-200"></div>
              <HeaderMenu className="flex-col items-start gap-4" />
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MainHeader;
