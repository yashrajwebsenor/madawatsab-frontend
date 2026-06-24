import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import routes from "@/app/configs/route-paths";
import { ProfileMatch, User } from "@/app/types/types";
import CommonUtils from "@/app/utils/common.utils";
import { addToast, Button, Card, Chip, Image } from "@heroui/react";
import clsx from "clsx";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import {
  IoBookmark,
  IoBookmarkOutline,
  IoChatbubbleEllipsesOutline,
  IoLocationOutline,
} from "react-icons/io5";
import { TiHeartFullOutline } from "react-icons/ti";
import PrivateBadge from "../shared/PrivateBadge";
import { InterestStatus } from "@/app/types/enum";
import useShortlist from "@/app/hooks/useShortlist";

type Props = {
  interestId?: string;
  // When set, Accept/Decline responds to this gallery request instead of an
  // interest (Gallery Requests tab).
  galleryRequestId?: string;
  refetch?: () => void;
  // Discovery sends a ProfileMatch (with interest flags); connections send a
  // plain User. Accept both — the interest flags are read optionally.
  profile: ProfileMatch | User;
  canAcceptDecline?: boolean;
  interestStatus?: InterestStatus;
  canInterestSendReceive?: boolean;
  // Profile Visits footer: Shortlist + Message instead of interest actions.
  canShortlistMessage?: boolean;
  // Hide the Message button in the Shortlist footer (e.g. Shortlisted tab,
  // where no connection exists so messaging isn't allowed).
  canMessage?: boolean;
};

const MatchCard = ({
  profile,
  refetch,
  interestId,
  galleryRequestId,
  interestStatus,
  canAcceptDecline,
  canInterestSendReceive,
  canShortlistMessage,
  canMessage = true,
}: Props) => {
  const [loading, setLoading] = useState(false);
  // Which respond action is in-flight, so we can keep both buttons mounted
  // (no layout shift) and only spin the pressed one.
  const [respondingTo, setRespondingTo] = useState<
    "accepted" | "declined" | null
  >(null);
  const queryClient = useQueryClient();

  const {
    _id,
    userId,
    profilePhoto,
    fullName,
    occupation,
    dob,
    qualification,
    sect,
    address,
    isPrivate,
    shouldBlur,
    isDeleted,
  } = profile;

  // Backend decides blur via subscription + privacy. Fall back to isPrivate
  // when the flag is absent (e.g. older responses).
  const blurred = shouldBlur ?? isPrivate;

  const router = useRouter();
  const age = dayjs().diff(dayjs(dob), "years");

  const handleCardClick = () => {
    // A self-deleted member has no profile to open and no actions to take.
    if (isDeleted) return;
    router.push(routes.matches.details(_id!));
  };

  const handleMessage = () => {
    router.push(routes.message.index);
  };

  const { isShortlisted, toggleShortlist } = useShortlist();
  const shortlisted = isShortlisted(_id);

  const handleShortlist = () => {
    if (_id) toggleShortlist(_id);
  };

  const handleSendInterest = async () => {
    try {
      setLoading(true);
      await api.post(ENDPOINTS.INTERESTS.SEND, {
        receiverId: profile?._id,
      });
      addToast({
        title: "Interest Sent",
        color: "success",
        description: "Interest sent successfully",
      });
      refetch?.();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDecline = async (status: "accepted" | "declined") => {
    const isGallery = !!galleryRequestId;
    try {
      setRespondingTo(status);
      await api.patch(
        isGallery
          ? ENDPOINTS.GALLERY_REQUESTS.RESPOND(galleryRequestId!)
          : ENDPOINTS.INTERESTS.RESPOND(interestId!),
        { status },
      );
      addToast({
        color: "success",
        title: `${isGallery ? "Request" : "Interest"} ${status}`,
        description: `${isGallery ? "Gallery request" : "Interest"} ${status} successfully`,
      });
      refetch?.();
      // Accepting an interest creates a connection — refresh the Connections
      // tab too so it appears without a manual page reload.
      if (!isGallery && status === "accepted") {
        queryClient.invalidateQueries({ queryKey: ["connections"] });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setRespondingTo(null);
    }
  };

  return (
    <Card
      as="div"
      isPressable={!isDeleted}
      shadow="none"
      onPress={handleCardClick}
      className="border-none bg-white h-full hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative overflow-hidden">
        <Image
          height={200}
          alt={fullName}
          width={"100%"}
          isZoomed={!blurred && !isDeleted}
          src={profilePhoto?.url}
          className={clsx("object-cover", {
            "blur-[6px]": blurred,
            "grayscale opacity-70": isDeleted,
          })}
        />
        {/* Hide the badge once a gallery grant unblurs this private profile. */}
        {!isDeleted && isPrivate && blurred && <PrivateBadge />}
        {/* z-20 keeps the bookmark clickable above the PrivateBadge overlay. */}
        {!isDeleted && (
          <Button
            isIconOnly
            size="sm"
            radius="full"
            variant="flat"
            onPress={handleShortlist}
            aria-label={shortlisted ? "Remove from shortlist" : "Shortlist"}
            className="absolute right-2 top-2 z-20 bg-white/80 backdrop-blur-sm"
          >
            {shortlisted ? (
              <IoBookmark className="text-primary" />
            ) : (
              <IoBookmarkOutline className="text-gray-600" />
            )}
          </Button>
        )}
      </div>

      <div className="p-3 text-sm">
        <div className="flex items-center gap-2 justify-between">
          <p className="font-medium">
            {CommonUtils.formatNameWithUserId({ fullName, userId })}
          </p>

          {isDeleted ? null : interestStatus === InterestStatus.declined ? (
            <p className="text-danger text-xs bg-danger/10 px-3 py-1 rounded-lg">
              Rejected
            </p>
          ) : (profile as ProfileMatch)?.isInterestSent ||
            (profile as ProfileMatch)?.isInterestReceived ? (
            <p className="text-primary text-xs bg-primary/10 px-3 py-1 rounded-lg">
              {(profile as ProfileMatch)?.isInterestSent
                ? "Interest Sent"
                : "Interested in You"}
            </p>
          ) : (
            canInterestSendReceive && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  isIconOnly
                  isLoading={loading}
                  onPress={handleSendInterest}
                >
                  {!loading && <TiHeartFullOutline />}
                </Button>
              </div>
            )
          )}
        </div>

        <p className="text-xs text-left text-gray-400 mt-1">
          {[occupation, age].filter(Boolean).join(", ")}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {sect && (
            <Chip size="sm" color="success" variant="flat">
              {CommonUtils.formatTitle(sect)}
            </Chip>
          )}
          {address?.cityName && (
            <Chip
              size="sm"
              color="warning"
              variant="flat"
              startContent={<IoLocationOutline size={12} />}
            >
              {address?.cityName}
            </Chip>
          )}
          {qualification && (
            <Chip size="sm" variant="flat">
              {qualification}
            </Chip>
          )}
        </div>

        {!isDeleted && canAcceptDecline && (
          <div className="mt-5 flex gap-3">
            <Button
              fullWidth
              size="sm"
              variant="flat"
              color="danger"
              isLoading={respondingTo === "declined"}
              isDisabled={respondingTo !== null}
              onPress={() => handleAcceptDecline("declined")}
              startContent={respondingTo !== "declined" && <IoMdClose />}
            >
              Decline Request
            </Button>
            <Button
              fullWidth
              size="sm"
              color="success"
              variant="flat"
              isLoading={respondingTo === "accepted"}
              isDisabled={respondingTo !== null}
              onPress={() => handleAcceptDecline("accepted")}
              startContent={
                respondingTo !== "accepted" && <TiHeartFullOutline />
              }
            >
              Accept Request
            </Button>
          </div>
        )}

        {!isDeleted && canShortlistMessage && (
          <div className="mt-5 flex gap-3">
            <Button
              fullWidth
              size="sm"
              variant={shortlisted ? "flat" : "bordered"}
              color={shortlisted ? "primary" : "default"}
              onPress={handleShortlist}
              startContent={
                shortlisted ? <IoBookmark /> : <IoBookmarkOutline />
              }
            >
              {shortlisted ? "Shortlisted" : "Shortlist"}
            </Button>
            {canMessage && (
              <Button
                fullWidth
                size="sm"
                color="primary"
                onPress={handleMessage}
                startContent={<IoChatbubbleEllipsesOutline />}
              >
                Message
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MatchCard;
