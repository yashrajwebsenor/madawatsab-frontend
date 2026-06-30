import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import routes from "@/app/configs/route-paths";
import useProfile from "@/app/hooks/useProfile";
import useShortlist from "@/app/hooks/useShortlist";
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
  Skeleton,
  useDisclosure,
} from "@heroui/react";
import clsx from "clsx";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoIosLock, IoMdClose } from "react-icons/io";
import {
  IoBookmark,
  IoBookmarkOutline,
  IoCallOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmark,
  IoImagesOutline,
  IoLanguageOutline,
  IoMailOutline,
  IoSchoolOutline,
} from "react-icons/io5";
import { MdOutlineWorkOutline, MdVerified } from "react-icons/md";
import { TiHeartFullOutline } from "react-icons/ti";
import { FiUnlock } from "react-icons/fi";
import PrivateBadge from "../shared/PrivateBadge";
import UserActionsMenu from "../shared/UserActionsMenu";
import { GalleryRequestStatus } from "@/app/types/enum";

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
  const { hasActivePlan, hasContactCredits, contactViewBalance } =
    useSubscriptionAccess();
  const { isShortlisted, toggleShortlist } = useShortlist();
  const shortlisted = isShortlisted(profile._id, profile.isShortlisted);

  const age = dayjs().diff(dayjs(profile?.dob), "years");
  const blurred = profile?.shouldBlur ?? profile?.isPrivate;
  // Photo blurred because viewer lacks a subscription (target is public).
  const subscriptionLocked = !!profile?.shouldBlur && !profile?.isPrivate;

  const [contact, setContact] = useState<RevealedContact>(null);
  // True while the initial already-unlocked check runs — render a placeholder
  // instead of flashing the reveal button for contacts that are unlocked.
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Which respond action is in-flight, so both buttons stay mounted and only
  // the pressed one spins.
  const [respondingTo, setRespondingTo] = useState<
    "accepted" | "declined" | null
  >(null);

  const isInterestSent = (profile as ProfileMatch)?.isInterestSent;
  const isInterestReceived = (profile as ProfileMatch)?.isInterestReceived;
  const isConnected = (profile as ProfileMatch)?.isConnected;
  const sentInterestId = (profile as ProfileMatch)?.sentInterestId;
  const receivedInterestId = (profile as ProfileMatch)?.receivedInterestId;
  const galleryRequestStatus = (profile as ProfileMatch)?.galleryRequestStatus;

  // Optimistic block state so the banner/menu flip instantly on block/unblock,
  // not only after the refetched profile arrives. Reset when the profile
  // changes. `null` = defer to the server value.
  const [blockedOverride, setBlockedOverride] = useState<boolean | null>(null);
  const isBlockedByMe =
    blockedOverride ?? (profile as ProfileMatch)?.isBlockedByMe;

  useEffect(() => {
    setBlockedOverride(null);
  }, [profile._id]);

  const [requestingPhotos, setRequestingPhotos] = useState(false);
  const [unblocking, setUnblocking] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  // Open (or reuse) the 1:1 room with this connected profile, then jump into it.
  const handleMessage = async () => {
    try {
      setOpeningChat(true);
      const res: any = await api.post(ENDPOINTS.CHAT.CREATE_ROOM, {
        receiverId: profile._id,
      });
      const roomId = res?.data?._id;
      if (roomId) {
        router.push(routes.message.chat(roomId));
      } else {
        router.push(routes.message.index);
      }
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not open chat",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setOpeningChat(false);
    }
  };

  const handleUnblock = async () => {
    try {
      setUnblocking(true);
      await api.delete(ENDPOINTS.BLOCKS.REMOVE(profile._id));
      addToast({ color: "success", title: "User unblocked" });
      setBlockedOverride(false);
      refetch?.();
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not unblock",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setUnblocking(false);
    }
  };

  // Ask a private profile for photo access. Subscribers only — the button is
  // hidden otherwise, and the backend enforces it regardless.
  const handleRequestPhotos = async () => {
    try {
      setRequestingPhotos(true);
      await api.post(ENDPOINTS.GALLERY_REQUESTS.SEND, {
        receiverId: profile._id,
      });
      addToast({
        color: "success",
        title: "Request Sent",
        description: "Photo request sent successfully",
      });
      refetch?.();
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not send request",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setRequestingPhotos(false);
    }
  };

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

  const handleRespond = async (status: "accepted" | "declined") => {
    if (!receivedInterestId) return;
    try {
      setRespondingTo(status);
      await api.patch(ENDPOINTS.INTERESTS.RESPOND(receivedInterestId), {
        status,
      });
      addToast({
        color: "success",
        title: `Interest ${status}`,
        description: `Interest ${status} successfully`,
      });
      refetch?.();
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not respond",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const handleCancelInterest = async () => {
    if (!sentInterestId) return;
    try {
      setCancelling(true);
      await api.delete(ENDPOINTS.INTERESTS.CANCEL(sentInterestId));
      addToast({
        color: "success",
        title: "Interest Cancelled",
        description: "Interest request cancelled",
      });
      refetch?.();
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not cancel interest",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setCancelling(false);
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
      } finally {
        if (active) setCheckingStatus(false);
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
          src={profile?.profilePhoto?.url}
          className={clsx("w-full h-full object-cover rounded-none", {
            "blur-[6px]": blurred,
          })}
        />
        {profile.isPrivate ? (
          // Hidden once a gallery grant unblurs this private profile.
          blurred && <PrivateBadge />
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
        {/* Gallery request — private targets, subscribed viewers, no grant yet.
            z-20 sits above the PrivateBadge overlay. */}
        {profile.isPrivate && blurred && hasActivePlan && (
          <div className="absolute inset-x-4 bottom-4 z-20">
            {galleryRequestStatus === GalleryRequestStatus.pending ? (
              <Button
                fullWidth
                size="sm"
                isDisabled
                className="bg-white/90 font-semibold"
                startContent={<IoImagesOutline size={16} />}
              >
                Photo Request Sent
              </Button>
            ) : (
              <Button
                fullWidth
                size="sm"
                color="primary"
                className="font-semibold"
                isLoading={requestingPhotos}
                onPress={handleRequestPhotos}
                startContent={!requestingPhotos && <IoImagesOutline size={16} />}
              >
                Request Photos
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-5 sm:p-8 lg:p-10 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-start gap-2">
              <h1 className="text-2xl w-fit font-bold text-gray-900">
                {CommonUtils.formatNameWithUserId(profile)}
              </h1>
              {profile?.isVerified && (
                <MdVerified
                  className="text-blue-500 text-2xl"
                  aria-label="Verified"
                />
              )}
            </div>
            <p className="text-gray-500 mt-1 font-medium">
              {age} Years • {profile?.address?.cityName},{" "}
              {profile?.address?.countryName}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              radius="full"
              variant="flat"
              onPress={() => toggleShortlist(profile._id)}
              aria-label={shortlisted ? "Remove from shortlist" : "Shortlist"}
            >
              {shortlisted ? (
                <IoBookmark size={18} className="text-primary" />
              ) : (
                <IoBookmarkOutline size={18} className="text-gray-600" />
              )}
            </Button>
            <UserActionsMenu
              userId={profile._id}
              isBlockedByMe={isBlockedByMe}
              onBlockChange={(blocked) => {
                setBlockedOverride(blocked);
                refetch?.();
              }}
            />
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

        {/* Interest actions — sit in the gap above contact details. */}
        <div className="mt-2">
          {isBlockedByMe ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  You blocked this user
                </p>
                <p className="text-xs text-gray-500">
                  Unblock to interact with this profile again.
                </p>
              </div>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                isLoading={unblocking}
                onPress={handleUnblock}
                startContent={!unblocking && <FiUnlock size={16} />}
              >
                Unblock
              </Button>
            </div>
          ) : receivedInterestId ? (
            // They sent us a pending interest: accept or decline.
            <div className="rounded-2xl border border-success/20 bg-success/5 p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <TiHeartFullOutline size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    Interested in You
                  </p>
                  <p className="text-xs text-gray-500">
                    Accept to start a conversation
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  fullWidth
                  variant="bordered"
                  color="danger"
                  isLoading={respondingTo === "declined"}
                  isDisabled={respondingTo !== null}
                  onPress={() => handleRespond("declined")}
                  startContent={
                    respondingTo !== "declined" && <IoMdClose size={18} />
                  }
                >
                  Reject
                </Button>
                <Button
                  fullWidth
                  color="success"
                  className="font-semibold text-white"
                  isLoading={respondingTo === "accepted"}
                  isDisabled={respondingTo !== null}
                  onPress={() => handleRespond("accepted")}
                  startContent={
                    respondingTo !== "accepted" && <IoCheckmark size={18} />
                  }
                >
                  Accept
                </Button>
              </div>
            </div>
          ) : sentInterestId ? (
            // We sent a pending interest: allow cancelling it inline.
            <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success/5 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <TiHeartFullOutline size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Interest Sent
                </p>
                <p className="text-xs text-gray-500">Awaiting their response</p>
              </div>
              <Button
                size="sm"
                variant="light"
                color="danger"
                className="font-medium"
                isLoading={cancelling}
                onPress={handleCancelInterest}
                startContent={!cancelling && <IoMdClose size={16} />}
              >
                Cancel
              </Button>
            </div>
          ) : isConnected ? (
            // Interest accepted in either direction: they're connected. Drop the
            // stale "Interest Sent" / "Interested in You" label and push them to
            // start a conversation.
            <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success/5 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <IoCheckmark size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">Connected</p>
                <p className="text-xs text-gray-500">
                  You both accepted — start a conversation
                </p>
              </div>
              <Button
                size="sm"
                color="success"
                className="font-semibold text-white"
                isLoading={openingChat}
                onPress={handleMessage}
                startContent={
                  !openingChat && <IoChatbubbleEllipsesOutline size={16} />
                }
              >
                Message
              </Button>
            </div>
          ) : isInterestSent ? (
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

        {/* Contact reveal — spends one wallet credit on first unlock. Hidden
            while this user is blocked. */}
        {!isBlockedByMe && (
        <div className="mt-auto pt-4 border-t border-gray-100">
          {checkingStatus ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          ) : contact ? (
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
        )}
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
