import { useState } from "react";
import api from "../api/api";
import ENDPOINTS from "../api/endpoints";
import useUserStore from "../store/useUserStore";
import { User } from "../types/types";
import { addToast } from "@heroui/react";
import CommonUtils from "../utils/common.utils";

const useProfile = () => {
  const { setUser } = useUserStore();
  const [loading, setLoading] = useState(false);

  const getMyProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(ENDPOINTS.PROFILE.GET);
      if (response?.data) {
        setUser(response?.data);
      }
    } catch (error) {
      console.log(error);
      CommonUtils.logout();
    } finally {
      setLoading(false);
    }
  };

  const updateMyProfile = async (body: Partial<User>) => {
    try {
      delete body.address;
      setLoading(true);
      const response = await api.put(ENDPOINTS.PROFILE.UPDATE, body);
      if (response?.data) {
        addToast({
          title: "Success",
          color: "success",
          description: "Profile updated successfully",
        });
        getMyProfile();
      }
      return;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getMyProfile,
    updateMyProfile,
  };
};

export default useProfile;
