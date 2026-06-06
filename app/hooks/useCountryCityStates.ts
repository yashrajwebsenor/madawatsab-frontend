import { useState } from "react";
import api from "../api/api";
import ENDPOINTS from "../api/endpoints";

type Option = {
  id: number;
  name: string;
};

const useCountryCityStates = () => {
  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);

  const fetchCountries = async () => {
    try {
      const res = await api.get(ENDPOINTS.CONFIGS.COUNTRY);
      setCountries(res?.data ?? []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchStates = async (countryId: number) => {
    if (!countryId) return;
    try {
      setStates([]);
      setCities([]);

      const res = await api.get(ENDPOINTS.CONFIGS.STATE(countryId));
      setStates(res?.data || []);
    } catch (error) {
      console.log("Error fetching states:", error);
    }
  };

  const fetchCities = async (countryId: number, stateId: number) => {
    if (!countryId || !stateId) return;
    try {
      setCities([]);
      const res = await api.get(ENDPOINTS.CONFIGS.CITY(countryId, stateId));
      setCities(res?.data || []);
    } catch (error) {
      console.log("Error fetching cities:", error);
    }
  };

  return {
    countries,
    states,
    cities,
    fetchCountries,
    fetchStates,
    fetchCities,
  };
};

export default useCountryCityStates;
