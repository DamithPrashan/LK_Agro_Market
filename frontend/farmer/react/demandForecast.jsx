import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DISTRICTS } from "../../../src/constants/districts";
import "../csss/dashBoard.css";
import { FaSearch, FaSeedling, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";

export default function ForecastDashboard() {
    const { t } = useTranslation();

    // Component Search States
    const [cropName, setCropName] = useState("carrot");
    const [location, setLocation] = useState("");
    const [days, setDays] = useState(7);

    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [optionsLoaded, setOptionsLoaded] = useState(false);

    // Fetch the farmer's own crops once, just to default the Location
    // dropdown to a district that actually has one of their listings.
    useEffect(() => {
        fetch("/backend/getCrops.php", { credentials: "include" })
            .then((res) => res.json())
            .then((crops) => {
                const firstCropLocation = Array.isArray(crops)
                    ? crops.find((c) => c.location)?.location
                    : null;
                setLocation(firstCropLocation || DISTRICTS[0].value);
                setOptionsLoaded(true);
            })
            .catch((err) => {
                console.error("Error loading crop options:", err);
                setLocation(DISTRICTS[0].value);
                setOptionsLoaded(true);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch call - uses a relative path so it works on any machine/domain
    // serving the app, instead of being hardcoded to one developer's localhost.
    const fetchForecast = async () => {
        if (!cropName || !location) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/backend/get_demand_forecast.php?crop_name=${encodeURIComponent(cropName)}&location=${encodeURIComponent(location)}&days=${days}`,
                { credentials: "include" }
            );
            const data = await res.json();
            if (data.status === "success") {
                setForecastData(data);
            } else {
                setForecastData(null);
            }
        } catch (error) {
            console.error("Error loading forecast metrics:", error);
            setForecastData(null);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch once the real crop/location options have loaded and
    // defaults have been set (instead of firing immediately with empty values).
    useEffect(() => {
        if (optionsLoaded && cropName && location) {
            fetchForecast();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [optionsLoaded]);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchForecast();
    };

    const cropEmoji =
        forecastData?.meta.crop_name.toLowerCase() === "tomato"
            ? "🍅"
            : forecastData?.meta.crop_name.toLowerCase() === "carrot"
                ? "🥕"
                : "🫘";

    return (
        <div className="section forecast-section">
            <div className="section-header">
                <h3>{t("forecast.title")}</h3>
            </div>

            {/* Search panel */}
            <form className="forecast-search-panel" onSubmit={handleSubmit}>
                <div className="search-field">
                    <label htmlFor="forecast-crop">
                        <FaSeedling /> {t("forecast.cropLabel")}
                    </label>
                    <input
                        id="forecast-crop"
                        type="text"
                        value={cropName}
                        onChange={(e) => setCropName(e.target.value)}
                        placeholder={t("forecast.cropPlaceholder")}
                    />
                </div>

                <div className="search-field">
                    <label htmlFor="forecast-location">
                        <FaMapMarkerAlt /> {t("forms.location")}
                    </label>
                    <select
                        id="forecast-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    >
                        <option value="">{t("forms.selectDistrict")}</option>
                        {DISTRICTS.map((d) => (
                            <option key={d.key} value={d.value}>
                                {t(`districts.${d.key}`)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="search-field search-field-narrow">
                    <label htmlFor="forecast-days">
                        <FaCalendarAlt /> {t("forecast.timeframeLabel")}
                    </label>
                    <select
                        id="forecast-days"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                    >
                        <option value="7">{t("forecast.timeframe7")}</option>
                        <option value="14">{t("forecast.timeframe14")}</option>
                        <option value="30">{t("forecast.timeframe30")}</option>
                    </select>
                </div>

                <button type="submit" className="search-btn" disabled={loading || !cropName || !location}>
                    <FaSearch />
                    {loading ? t("forecast.btnAnalyzing") : t("forecast.btnSearch")}
                </button>
            </form>

            {/* --- YOUR LIVE FORECAST VIEW INSERTED HERE --- */}
            {forecastData && (
                <div className="forecast-meta">
                    {t("forecast.showingData", {
                        cropName: forecastData.meta.crop_name,
                        location: forecastData.meta.location,
                        days: forecastData.meta.lookback_period_days
                    })}
                </div>
            )}

            <div className="forecast-grid">
                {forecastData ? (
                    <>
                        {/* 1. Demand Volume Card */}
                        <div className="forecast-card">
                            <div className="crop-icon">{cropEmoji}</div>
                            <h4>{t("forecast.volumeHeader", { cropName: forecastData.meta.crop_name })}</h4>
                            <p
                                className={
                                    forecastData.demand_metrics.total_quantity_demanded > 150
                                        ? "high"
                                        : "medium"
                                }
                            >
                                {t("forecast.demandLabel", {
                                    level: forecastData.demand_metrics.total_quantity_demanded > 150
                                        ? t("forecast.demandHigh", "High")
                                        : t("forecast.demandMedium", "Medium")
                                })}
                            </p>
                            <small>
                                {t("forecast.requestedQty", { qty: forecastData.demand_metrics.total_quantity_demanded })}
                            </small>
                            <div className="forecast-detail-list">
                                <div>
                                    {t("forecast.totalPreOrders", { count: forecastData.demand_metrics.total_pre_orders_placed })}
                                </div>
                                <div>
                                    {t("forecast.uniqueBuyers", { count: forecastData.demand_metrics.unique_buyers_count })}
                                </div>
                                <div>
                                    {t("forecast.avgOrderSize", { qty: forecastData.demand_metrics.average_quantity_per_order })}
                                </div>
                            </div>
                        </div>

                        {/* 2. Pricing Insights Card */}
                        <div className="forecast-card">
                            <div className="crop-icon">💰</div>
                            <h4>{t("forecast.marketPricing")}</h4>
                            <p className="price-highlight">
                                {t("forecast.avgPrice", { price: forecastData.pricing_insights.avg_pre_order_price })}
                            </p>
                            <small>{t("forecast.valuationRange")}</small>
                            <div className="forecast-detail-list">
                                <div>
                                    {t("forecast.minPrice", { price: forecastData.pricing_insights.min_pre_order_price })}
                                </div>
                                <div>
                                    {t("forecast.maxPrice", { price: forecastData.pricing_insights.max_pre_order_price })}
                                </div>
                            </div>
                        </div>

                        {/* 3. Supply & Cultivation Card */}
                        <div className="forecast-card">
                            <div className="crop-icon">🧑‍🌾</div>
                            <h4>{t("forecast.supplyProfile")}</h4>
                            <p className="low">
                                {t("forecast.activeFarmers", {
                                    count: forecastData.supply_cultivation_insights.active_farmers_count
                                })}
                            </p>
                            <small>
                                {t("forecast.acres", {
                                    area: forecastData.supply_cultivation_insights.total_cultivated_area
                                })}
                            </small>
                            <div className="forecast-detail-list">
                                <div>
                                    {t("forecast.avgLand", {
                                        size: forecastData.supply_cultivation_insights.average_cultivated_area_per_farmer
                                    })}
                                </div>
                                <div>
                                    {t("forecast.avgStock", {
                                        qty: forecastData.supply_cultivation_insights.average_available_quantity_per_farmer
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="forecast-empty">
                        <p>{t("emptyStates.noForecastData")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

