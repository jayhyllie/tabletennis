import { useState, useEffect, useCallback } from "react";

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  const handleChange = useCallback(() => {
    setMatches(window.matchMedia(query).matches);
  }, [query]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const matchMedia = window.matchMedia(query);

    // Trigger user callback and state update
    handleChange();

    // Listen for changes
    matchMedia.addEventListener("change", handleChange);

    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
  }, [query, handleChange]);

  return matches;
};

export default useMediaQuery;
