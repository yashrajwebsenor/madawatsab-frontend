import {
  LuBuilding2,
  LuLifeBuoy,
  LuLogOut,
  LuReceipt,
  LuTrash2,
  LuUser,
  LuUserX,
} from "react-icons/lu";
import { Office } from "@/app/types/types";
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
import useCityOffice from "@/app/hooks/useCityOffice";

/**
 * Read-only office summary shown at the bottom of the account dropdown. The
 * dropdown item is disabled, so nothing here can be a link (pointer events
 * never reach it) — the tappable version lives on My Profile and Help &
 * Support, which is where the full CityOfficeCard is rendered.
 */
const OfficeMenuBlock = ({ office }: { office: Office }) => (
  <div className="flex flex-col gap-2 py-1">
    <div className="flex items-center gap-2">
      <LuBuilding2 className="text-base text-primary" />
      <p className="text-xs font-semibold text-default-700">
        Our {office.cityName} office
      </p>
    </div>

    {office.address && (
      <p className="whitespace-pre-line text-xs leading-5 text-default-500">
        {office.address}
      </p>
    )}

    {office.phone && (
      <p className="text-xs font-medium text-default-600">{office.phone}</p>
    )}

    {office.openingHours && (
      <p className="text-[11px] text-default-400">{office.openingHours}</p>
    )}

    {office.agents.length > 0 && (
      <div className="flex flex-col gap-1.5 border-t border-default-200 pt-2">
        {office.agents.map((agent) => (
          <div key={agent._id} className="flex items-center gap-2">
            <Avatar
              size="sm"
              name={agent.fullName}
              src={agent.profilePhoto?.url}
              className="h-5 w-5 shrink-0 text-[10px]"
            />
            <span className="truncate text-xs text-default-600">
              {agent.fullName}
            </span>
            <span className="ml-auto shrink-0 text-[11px] text-default-400">
              {agent.mobile}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const UserMenu = () => {
  const { user } = useUserStore();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Read here rather than inside the item so the menu width can react to it,
  // and so the item is left out entirely for cities without an office.
  const { office } = useCityOffice();

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
    <Dropdown
      size="sm"
      placement="bottom-end"
      className={office ? "min-w-[300px]" : "min-w-[220px]"}
    >
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
        // Both are read-only blocks, not actions — selecting them does nothing.
        disabledKeys={["profile_info", "office_info"]}
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
          showDivider={!!office}
        >
          Delete Account
        </DropdownItem>

        {office ? (
          <DropdownItem
            key="office_info"
            className="opacity-100 cursor-default data-[hover=true]:bg-transparent"
            textValue={`Our ${office.cityName} office`}
          >
            <OfficeMenuBlock office={office} />
          </DropdownItem>
        ) : null}
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
