import React, { createContext, useContext, useState, useCallback } from "react";

const CropContext = createContext(null);

export function CropProvider({ children }) {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCrops = useCallback(async (filters = {}, searchQuery = "") => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append("search_query", searchQuery);
      if (filters.district && filters.district !== "All" && filters.district !== "All Districts") {
        queryParams.append("district", filters.district);
      }
      if (filters.cropType && filters.cropType !== "All Crops") {
        queryParams.append("crop_type", filters.cropType);
      }

      // Validate and apply Price Min / Max (Min Price should not exceed Max Price)
      const isPriceRangeValid = !(
        filters.priceMin &&
        filters.priceMax &&
        parseFloat(filters.priceMin) > parseFloat(filters.priceMax)
      );

      if (isPriceRangeValid) {
        if (filters.priceMin) queryParams.append("minPrice", filters.priceMin);
        if (filters.priceMax) queryParams.append("maxPrice", filters.priceMax);
      }

      if (filters.harvestFrom) queryParams.append("harvestFrom", filters.harvestFrom);
      if (filters.harvestTo) queryParams.append("harvestTo", filters.harvestTo);
      if (filters.isVerified) queryParams.append("is_verified", "true");
      if (filters.sortBy) queryParams.append("sort_by", filters.sortBy);

      // Append cache buster to prevent browser cache
      queryParams.append("_t", Date.now().toString());

      const response = await fetch(`/backend/Apis/listings/get_listings.php?${queryParams.toString()}`);
      const data = await response.json();

      if (data.success && data.listings) {
        setCrops(data.listings);
      } else {
        console.error("API Error: ", data.message);
        setCrops([]);
      }
    } catch (err) {
      console.error("Fetch failed: ", err);
      setCrops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCropQuantity = useCallback((cropId, newQuantity) => {
    setCrops((prevCrops) =>
      prevCrops.map((crop) =>
        crop.id === cropId || String(crop.id) === String(cropId)
          ? { ...crop, qty: newQuantity }
          : crop
      )
    );
  }, []);

  return (
    <CropContext.Provider value={{ crops, loading, fetchCrops, updateCropQuantity }}>
      {children}
    </CropContext.Provider>
  );
}

export function useCrops() {
  const context = useContext(CropContext);
  if (!context) {
    throw new Error("useCrops must be used within a CropProvider");
  }
  return context;
}
