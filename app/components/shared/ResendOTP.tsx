import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { addToast } from "@heroui/react";
import clsx from "clsx";
import { useEffect, useState } from "react";

const TIMER_DURATION = 30;

const ResendOTP = ({ mobile }: { mobile: string }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedTargetTime = localStorage.getItem("otpExpiryTime");
    let targetTime;

    if (savedTargetTime) {
      targetTime = parseInt(savedTargetTime, 10);
    } else {
      targetTime = Date.now() + TIMER_DURATION * 1000;
      localStorage.setItem("otpExpiryTime", targetTime.toString());
    }

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        localStorage.removeItem("otpExpiryTime");
      }
    };

    tick();
    const timerId = setInterval(tick, 1000);

    return () => clearInterval(timerId);
  }, []);

  const handleResend = async () => {
    try {
      setLoading(true);
      await api.post(ENDPOINTS.AUTH.RESEND_OTP, {
        mobile,
      });
      addToast({
        color: "success",
        title: "OTP Resent",
        description: "OTP has been sent to your mobile number",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between my-2">
      <p className="text-sm text-gray-400">
        {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : "Didn't receive OTP?"}
      </p>
      {!loading && (
        <button
          type="button"
          disabled={timeLeft > 0}
          onClick={handleResend}
          className={clsx(
            "text-sm font-medium",
            timeLeft > 0 ? "text-gray-500 cursor-not-allowed" : "text-primary",
          )}
        >
          Resend OTP
        </button>
      )}
    </div>
  );
};

export default ResendOTP;
