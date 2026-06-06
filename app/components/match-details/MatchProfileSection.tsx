import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import routes from "@/app/configs/route-paths";
import useProfile from "@/app/hooks/useProfile";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";
import { ProfileMatch, User } from "@/app/types/types";
import CommonUtils from "@/app/utils/common.utils";
import {
  addToast,
  Button,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import clsx from "clsx";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoIosLock } from "react-icons/io";
import {
  IoCallOutline,
  IoLanguageOutline,
  IoMailOutline,
  IoSchoolOutline,
} from "react-icons/io5";
import { MdOutlineWorkOutline, MdVerified } from "react-icons/md";
import { TiHeartFullOutline } from "react-icons/ti";
import PrivateBadge from "../shared/PrivateBadge";

type RevealedContact = { mobile?: string; email?: string } | null;

const MatchProfileSection = ({
  profile,
  refetch,
}: {
  profile: User;
  refetch?: () => void;
}) => {
  const router = useRouter();
  const { getMyProfile } = useProfile();
  const { hasContactCredits, contactViewBalance } = useSubscriptionAccess();

  const age = dayjs().diff(dayjs(profile?.dob), "years");
  const blurred = profile?.shouldBlur ?? profile?.isPrivate;
  // Photo blurred because viewer lacks a subscription (target is public).
  const subscriptionLocked = !!profile?.shouldBlur && !profile?.isPrivate;

  const [contact, setContact] = useState<RevealedContact>(null);
  const [revealing, setRevealing] = useState(false);
  const [sendingInterest, setSendingInterest] = useState(false);

  const isInterestSent = (profile as ProfileMatch)?.isInterestSent;
  const isInterestReceived = (profile as ProfileMatch)?.isInterestReceived;

  const handleSendInterest = async () => {
    try {
      setSendingInterest(true);
      await api.post(ENDPOINTS.INTERESTS.SEND, { receiverId: profile._id });
      addToast({
        color: "success",
        title: "Interest Sent",
        description: "Interest sent successfully",
      });
      refetch?.();
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not send interest",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setSendingInterest(false);
    }
  };
  const {
    isOpen: isConfirmOpen,
    onOpen: onConfirmOpen,
    onClose: onConfirmClose,
  } = useDisclosure();

  // On load, show the contact if this profile was already unlocked — without
  // spending a view.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res: any = await api.get(
          ENDPOINTS.SUBSCRIPTION.CONTACT_STATUS(profile._id),
        );
        if (active && res?.data?.unlocked) {
          setContact(res.data.contact ?? null);
        }
      } catch {
        // Non-blocking: reveal button stays available on failure.
      }
    })();
    return () => {
      active = false;
    };
  }, [profile._id]);

  const handleReveal = async () => {
    try {
      setRevealing(true);
      const res: any = await api.get(
        ENDPOINTS.SUBSCRIPTION.VIEW_CONTACT(profile._id),
      );
      const data = res?.data;
      setContact(data?.contact ?? null);

      // A fresh unlock spent a credit; refresh the wallet. "Previously unlocked"
      // costs nothing, so no refresh needed.
      if (data?.message !== "Previously unlocked") {
        await getMyProfile();
      }
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not reveal contact",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setRevealing(false);
      onConfirmClose();
    }
  };

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm flex flex-col md:flex-row w-full border border-gray-100 lg:h-[580px]">
      <div className="w-full md:w-[350px] lg:w-[360px] aspect-[4/5] md:aspect-auto relative md:self-stretch">
        <Image
          removeWrapper
          alt={profile.fullName}
          src={profile?.photos?.[0]?.url}
          className={clsx("w-full h-[400px] md:h-full md:min-h-full object-cover rounded-none", {
            "blur-[2px]": blurred,
          })}
        />
        {profile.isPrivate ? (
          <PrivateBadge />
        ) : (
          subscriptionLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 text-white">
              <div className="bg-white/20 backdrop-blur-md p-2 rounded-full mb-2">
                <IoIosLock size={24} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Subscribe to view photo
              </p>
            </div>
          )
        )}
      </div>

      <div className="flex-1 p-8 lg:p-10 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-start gap-2">
              <h1 className="text-2xl w-fit font-bold text-gray-900">
                {CommonUtils.formatNameWithUserId(profile)}
              </h1>
              <MdVerified className="text-blue-500 text-2xl" />
            </div>
            <p className="text-gray-500 mt-1 font-medium">
              {age} Years • {profile?.address?.cityName},{" "}
              {profile?.address?.countryName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profile.workSector && (
            <div className="bg-[#F0F9F9] p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                Profession
              </p>
              <p className="font-bold text-gray-800">
                {CommonUtils.formatTitle(profile.workSector)}
              </p>
            </div>
          )}
          {profile.sect && (
            <div className="bg-[#FFFBEB] p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                Sect / Religion
              </p>
              <p className="font-bold text-gray-800">
                {CommonUtils.formatTitle(profile.sect)} Muslim
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {profile.qualification && (
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50">
                <IoSchoolOutline size={20} className="text-primary" />
              </div>
              <span className="text-sm font-medium">
                {CommonUtils.formatTitle(profile.qualification)}
              </span>
            </div>
          )}
          {profile.occupation && (
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50">
                <MdOutlineWorkOutline size={20} className="text-primary" />
              </div>
              <span className="text-sm font-medium">
                {CommonUtils.formatTitle(profile.occupation)}
              </span>
            </div>
          )}
          {profile.language && (
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50">
                <IoLanguageOutline size={20} className="text-primary" />
              </div>
              <span className="text-sm font-medium">{profile.language}</span>
            </div>
          )}
        </div>

        {/* Send interest — sits in the gap above contact details. */}
        <div className="mt-2">
          {isInterestSent ? (
            <div className="flex items-center justify-center gap-2 w-full rounded-xl bg-success/10 text-success py-3 text-sm font-semibold">
              <TiHeartFullOutline size={18} />
              Interest Sent
            </div>
          ) : isInterestReceived ? (
            <div className="flex items-center justify-center gap-2 w-full rounded-xl bg-success/10 text-success py-3 text-sm font-semibold">
              <TiHeartFullOutline size={18} />
              Interested in You
            </div>
          ) : (
            <Button
              fullWidth
              color="success"
              className="font-semibold text-white"
              isLoading={sendingInterest}
              onPress={handleSendInterest}
              startContent={!sendingInterest && <TiHeartFullOutline size={18} />}
            >
              Send Interest
            </Button>
          )}
        </div>

        {/* Contact reveal — spends one wallet credit on first unlock. */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          {contact ? (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                Contact Details
              </p>
              {contact.mobile && (
                <div className="flex items-center gap-2 text-gray-700 text-sm font-semibold">
                  <IoCallOutline size={18} className="text-primary" />
                  {contact.mobile}
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2 text-gray-700 text-sm font-semibold">
                  <IoMailOutline size={18} className="text-primary" />
                  {contact.email}
                </div>
              )}
            </div>
          ) : hasContactCredits ? (
            <div className="flex flex-col gap-2">
              <Button
                color="primary"
                isLoading={revealing}
                onPress={onConfirmOpen}
                startContent={!revealing && <IoCallOutline size={18} />}
              >
                Reveal Contact
              </Button>
              <span className="text-xs text-gray-400">
                Uses 1 contact view • {contactViewBalance} remaining
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                color="primary"
                variant="flat"
                onPress={() => router.push(routes.pricing)}
                startContent={<IoIosLock size={16} />}
              >
                Buy a plan to get contact views
              </Button>
              <span className="text-xs text-gray-400">
                You have 0 contact views remaining
              </span>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={onConfirmClose}
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Reveal contact?
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-600">
                  This uses 1 contact view. You have {contactViewBalance}{" "}
                  remaining.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isLoading={revealing}
                  onPress={handleReveal}
                  startContent={!revealing && <IoCallOutline size={18} />}
                >
                  Reveal Contact
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default MatchProfileSection;
