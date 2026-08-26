import { apiRequest } from "./client";

export interface GeoCountry {
  code: string;
  name: string;
  flag: string;
  hasLga: boolean;
  stateLabel: string;
  lgaLabel: string;
}

export interface GeoState {
  code: string;
  name: string;
}

export interface GeoLocationValue {
  countryCode: string;
  countryName: string;
  stateCode: string;
  stateName: string;
  lga: string;
}

export const emptyGeoLocation = (
  countryCode = "NG",
  countryName = "Nigeria",
): GeoLocationValue => ({
  countryCode,
  countryName,
  stateCode: "",
  stateName: "",
  lga: "",
});

export const geoService = {
  countries: (signal?: AbortSignal) =>
    apiRequest<{ countries: GeoCountry[] }>(
      "/public/geo/countries",
      signal ? { signal } : {},
    ),

  states: (countryCode: string, signal?: AbortSignal) =>
    apiRequest<{ country: GeoCountry; states: GeoState[] }>(
      `/public/geo/${countryCode}/states`,
      signal ? { signal } : {},
    ),

  lgas: (countryCode: string, stateCode: string, signal?: AbortSignal) =>
    apiRequest<{ country: GeoCountry; stateCode: string; lgas: string[] }>(
      `/public/geo/${countryCode}/states/${encodeURIComponent(stateCode)}/lgas`,
      signal ? { signal } : {},
    ),
};
