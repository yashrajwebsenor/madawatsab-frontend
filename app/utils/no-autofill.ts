/**
 * Props that stop Chrome's saved-address autofill from appearing over a
 * location field.
 *
 * Country/state/city (and the pincode that follows from them) are only valid
 * when they come from the dropdown — the selection is what carries the id the
 * API needs. Picking a browser suggestion instead types text into the box
 * without ever selecting an option, so the field looks filled but submits
 * nothing.
 *
 * react-aria already sets autoComplete="off" on these inputs, but Chrome
 * ignores "off" on anything its heuristics read as an address field (it matches
 * on the name/label text). Claiming to be a new-password field is the one
 * classification it will not address-fill, and the opaque `name` keeps those
 * heuristics from recognising country/state/city/pincode in the first place.
 *
 * Spread into HeroUI's `inputProps` on an Autocomplete, or directly onto an
 * Input:
 *
 *   <Autocomplete inputProps={noAutofill("onboarding-country")} … />
 *   <Input {...noAutofill("request-agent-pincode")} … />
 */
const noAutofill = (name: string) => ({
  autoComplete: "new-password",
  name,
});

export default noAutofill;
