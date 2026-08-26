import { useEffect, useMemo, useRef, useState } from "react";
import {
  emptyGeoLocation,
  geoService,
  type GeoCountry,
  type GeoLocationValue,
  type GeoState,
} from "@/shared/api/geo";

interface GeoLocationSelectsProps {
  value: GeoLocationValue;
  onChange: (value: GeoLocationValue) => void;
  defaultCountryCode?: string;
  disabled?: boolean;
  className?: string;
  title?: string;
}

const inputClassName =
  "w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60";

export function GeoLocationSelects({
  value,
  onChange,
  defaultCountryCode = "NG",
  disabled = false,
  className = "",
  title = "Location",
}: GeoLocationSelectsProps) {
  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [states, setStates] = useState<GeoState[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingLgas, setLoadingLgas] = useState(false);
  const initializedDefault = useRef(false);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === value.countryCode),
    [countries, value.countryCode],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoadingCountries(true);
    void geoService
      .countries(controller.signal)
      .then((response) => {
        setCountries(response.countries);
        if (!initializedDefault.current && !value.countryCode) {
          const fallback =
            response.countries.find(
              (country) => country.code === defaultCountryCode,
            ) ?? response.countries[0];
          if (fallback) {
            initializedDefault.current = true;
            onChange(emptyGeoLocation(fallback.code, fallback.name));
          }
        }
      })
      .finally(() => setLoadingCountries(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- default country is applied once on mount
  }, [defaultCountryCode]);

  useEffect(() => {
    if (!value.countryCode) {
      setStates([]);
      setLgas([]);
      return;
    }

    const controller = new AbortController();
    setLoadingStates(true);
    void geoService
      .states(value.countryCode, controller.signal)
      .then((response) => setStates(response.states))
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));

    return () => controller.abort();
  }, [value.countryCode]);

  useEffect(() => {
    if (!value.countryCode || !value.stateCode) {
      setLgas([]);
      return;
    }

    const controller = new AbortController();
    setLoadingLgas(true);
    void geoService
      .lgas(value.countryCode, value.stateCode, controller.signal)
      .then((response) => setLgas(response.lgas))
      .catch(() => setLgas([]))
      .finally(() => setLoadingLgas(false));

    return () => controller.abort();
  }, [value.countryCode, value.stateCode]);

  const lgaUsesSelect = Boolean(selectedCountry?.hasLga && lgas.length > 0);
  const stateUsesSelect = states.length > 0;
  const stateLabel = selectedCountry?.stateLabel ?? "State / Region";
  const lgaLabel = selectedCountry?.lgaLabel ?? "Local area";

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        <div className="sm:col-span-2">
          <label className="font-bold text-slate-700 block mb-1">Country</label>
          <div className="relative">
            {value.countryCode && selectedCountry ? (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base">
                {selectedCountry.flag}
              </span>
            ) : null}
            <select
              value={value.countryCode}
              disabled={disabled || loadingCountries}
              onChange={(event) => {
                const country = countries.find(
                  (item) => item.code === event.target.value,
                );
                onChange(
                  emptyGeoLocation(
                    event.target.value,
                    country?.name ?? event.target.value,
                  ),
                );
              }}
              className={`${inputClassName} ${selectedCountry ? "pl-10" : ""}`}
            >
              <option value="">
                {loadingCountries ? "Loading countries…" : "Select country"}
              </option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {stateLabel}
          </label>
          {stateUsesSelect ? (
            <select
              value={value.stateCode}
              disabled={disabled || loadingStates || !value.countryCode}
              onChange={(event) => {
                const state = states.find(
                  (item) => item.code === event.target.value,
                );
                onChange({
                  ...value,
                  stateCode: event.target.value,
                  stateName: state?.name ?? event.target.value,
                  lga: "",
                });
              }}
              className={inputClassName}
            >
              <option value="">
                {loadingStates ? "Loading…" : `Select ${stateLabel.toLowerCase()}`}
              </option>
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value.stateName}
              disabled={disabled || !value.countryCode}
              placeholder={`Enter ${stateLabel.toLowerCase()}`}
              onChange={(event) =>
                onChange({
                  ...value,
                  stateCode: event.target.value,
                  stateName: event.target.value,
                  lga: "",
                })
              }
              className={inputClassName}
            />
          )}
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {lgaLabel}
          </label>
          {lgaUsesSelect ? (
            <select
              value={value.lga}
              disabled={disabled || loadingLgas || !value.stateCode}
              onChange={(event) =>
                onChange({
                  ...value,
                  lga: event.target.value,
                })
              }
              className={inputClassName}
            >
              <option value="">
                {loadingLgas ? "Loading…" : `Select ${lgaLabel.toLowerCase()}`}
              </option>
              {lgas.map((lga) => (
                <option key={lga} value={lga}>
                  {lga}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value.lga}
              disabled={disabled || !value.stateCode}
              placeholder={`Enter ${lgaLabel.toLowerCase()}`}
              onChange={(event) =>
                onChange({
                  ...value,
                  lga: event.target.value,
                })
              }
              className={inputClassName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
