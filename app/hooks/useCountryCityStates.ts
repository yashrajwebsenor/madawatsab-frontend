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
  // Some countries (e.g. Antarctica) genuinely have zero states/cities in the
  // seeded data. These distinguish "still fetching" / "not fetched yet" from
  // "fetched and there are none", so callers can stop requiring a selection
  // instead of leaving the user stuck on a permanently-empty dropdown.
  const [statesLoaded, setStatesLoaded] = useState(false);
  const [citiesLoaded, setCitiesLoaded] = useState(false);

  const fetchCountries = async () => {
    try {
      const res = await api.get(ENDPOINTS.CONFIGS.COUNTRY);
      setCountries(res?.data ?? []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchStates = async (countryId: number) => {
    if (!countryId) return [];
    try {
      setStates([]);
      setCities([]);
      setStatesLoaded(false);
      setCitiesLoaded(false);

      const res = await api.get(ENDPOINTS.CONFIGS.STATE(countryId));
      const result = res?.data || [];
      setStates(result);
      setStatesLoaded(true);
      return result;
    } catch (error) {
      console.log("Error fetching states:", error);
      setStatesLoaded(true);
      return [];
    }
  };

  const fetchCities = async (countryId: number, stateId: number) => {
    if (!countryId || !stateId) return [];
    try {
      setCities([]);
      setCitiesLoaded(false);
      const res = await api.get(ENDPOINTS.CONFIGS.CITY(countryId, stateId));
      const result = res?.data || [];
      setCities(result);
      setCitiesLoaded(true);
      return result;
    } catch (error) {
      console.log("Error fetching cities:", error);
      setCitiesLoaded(true);
      return [];
    }
  };

  return {
    countries,
    states,
    cities,
    statesLoaded,
    citiesLoaded,
    fetchCountries,
    fetchStates,
    fetchCities,
  };
};

export default useCountryCityStates;
