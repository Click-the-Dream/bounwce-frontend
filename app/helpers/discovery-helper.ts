"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "home_discovery_state";

const load = () => {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};

const save = (state: any) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const discoveryHelper = () => {
  const persisted = load();

  const [searchValue, setSearchValue] = useState(persisted?.searchValue || "");
  const [query, setQuery] = useState(persisted?.query || "");
  const [currentIndex, setCurrentIndex] = useState(
    persisted?.currentIndex || 0,
  );
  const [hasSearched, setHasSearched] = useState(
    persisted?.hasSearched || false,
  );

  useEffect(() => {
    save({ searchValue, query, currentIndex, hasSearched });
  }, [searchValue, query, currentIndex, hasSearched]);

  return {
    searchValue,
    setSearchValue,
    query,
    setQuery,
    currentIndex,
    setCurrentIndex,
    hasSearched,
    setHasSearched,
  };
};
