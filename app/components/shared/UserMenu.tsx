import {
  LuLifeBuoy,
  LuLogOut,
  LuReceipt,
  LuTrash2,
  LuUser,
  LuUserX,
} from "react-icons/lu";
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
import { useState } from "react";
import routes from "@/app/configs/route-paths";
import DeleteAccountDialog from "../dialogs/DeleteAccountDialog";

const UserMenu = () => {
  const { user } = useUserStore();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleAction = (key: React.Key) => {
    switch (key) {
      case "logout":
        CommonUtils.logout();
        break;
      case "profile":
        router.push(routes.profile);
        break;
      case "billing":
        router.push(routes.billing);
        break;
      case "help":
        router.push(routes.helpSupport);
        break;
      case "blocked":
        router.push(routes.blockedUsers);
        break;
      case "delete":
        setDeleteOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
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
          key="billing"
          startContent={<LuReceipt className="text-lg text-default-500" />}
        >
          Billing & Invoices
        </DropdownItem>

        <DropdownItem
          key="help"
          startContent={<LuLifeBuoy className="text-lg text-default-500" />}
        >
          Help & Support
        </DropdownItem>

        <DropdownItem
          key="blocked"
          showDivider
          startContent={<LuUserX className="text-lg text-default-500" />}
        >
          Blocked Users
        </DropdownItem>

        <DropdownItem
          key="logout"
          startContent={<LuLogOut className="text-lg text-default-500" />}
        >
          Log Out
        </DropdownItem>

        <DropdownItem
          key="delete"
          color="danger"
          className="text-danger"
          startContent={<LuTrash2 className="text-lg" />}
        >
          Delete Account
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>

      <DeleteAccountDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
};

export default UserMenu;
