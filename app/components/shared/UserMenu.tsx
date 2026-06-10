import { LuLifeBuoy, LuLogOut, LuSettings, LuUser } from "react-icons/lu";
import useUserStore from "@/app/store/useUserStore";
import CommonUtils from "@/app/utils/common.utils";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import routes from "@/app/configs/route-paths";

const UserMenu = () => {
  const { user } = useUserStore();
  const router = useRouter();

  const handleAction = (key: React.Key) => {
    switch (key) {
      case "logout":
        CommonUtils.logout();
        break;
      case "profile":
        router.push(routes.profile);
        break;
      case "help":
        router.push(routes.helpSupport);
        break;
      default:
        break;
    }
  };

  return (
    <Dropdown size="sm" placement="bottom-end" className="min-w-[220px]">
      <DropdownTrigger>
        <Avatar
          size="sm"
          isBordered
          as="button"
          radius="md"
          color="primary"
          name={user?.fullName}
          className="object-cover transition-transform"
          src={user?.profilePhoto?.url}
        />
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Profile Actions"
        onAction={handleAction}
        variant="flat"
        disabledKeys={["profile_info"]}
      >
        <DropdownItem
          key="profile_info"
          className="h-14 gap-2 opacity-100 cursor-default"
          textValue="Signed in as"
          showDivider
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-default-500">Signed in as</p>
            <p className="font-semibold text-primary truncate max-w-[150px]">
              {user?.fullName || user?.mobile}
            </p>
          </div>
        </DropdownItem>

        <DropdownItem
          key="profile"
          startContent={<LuUser className="text-lg text-default-500" />}
        >
          My Profile
        </DropdownItem>

        <DropdownItem
          key="help"
          startContent={<LuLifeBuoy className="text-lg text-default-500" />}
        >
          Help & Support
        </DropdownItem>

        <DropdownItem
          key="settings"
          showDivider
          startContent={<LuSettings className="text-lg text-default-500" />}
        >
          Settings
        </DropdownItem>

        <DropdownItem
          key="logout"
          color="danger"
          className="text-danger"
          startContent={<LuLogOut className="text-lg" />}
        >
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default UserMenu;
