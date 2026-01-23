export const getLanguageCode = (headerValue: string | null) => {
  if (!headerValue) {
    return "en";
  }
  const first = headerValue.split(",")[0]?.trim();
  if (!first) {
    return "en";
  }
  return first.split(";")[0]?.trim() || "en";
};
