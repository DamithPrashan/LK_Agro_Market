import React, { useState, useEffect } from "react";
import "../csss/dashBoard.css";
import { FaSearch, FaSeedling, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";

export default function ForecastDashboard() {
    // Component Search States
    const [cropName, setCropName] = useState("carrot");
    const [location, setLocation] = useState("Ratnapura");
    const [days, setDays] = useState(7);

    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch call - uses a relative path so it works on any machine/domain
    // serving the app, instead of being hardcoded to one developer's localhost.
    const fetchForecast = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/backend/get_demand_forecast.php?crop_name=${cropName}&location=${location}&days=${days}`,
                { credentials: "include" }
            );
            const data = await res.json();
            if (data.status === "success") {
                setForecastData(data);
            }
        } catch (error) {
            console.error("Error loading forecast metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch entry metrics on initial component mount
    useEffect(() => {
        fetchForecast();
    }, []);

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
                <h3>Demand Forecast &amp; Analysis</h3>
            </div>

            {/* Search panel */}
            <form className="forecast-search-panel" onSubmit={handleSubmit}>
                <div className="search-field">
                    <label htmlFor="forecast-crop">
                        <FaSeedling /> Crop
                    </label>
                    <input
                        id="forecast-crop"
                        type="text"
                        value={cropName}
                        onChange={(e) => setCropName(e.target.value)}
                        placeholder="e.g. carrot"
                    />
                </div>

                <div className="search-field">
                    <label htmlFor="forecast-location">
                        <FaMapMarkerAlt /> Location
                    </label>
                    <input
                        id="forecast-location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Ratnapura"
                    />
                </div>

                <div className="search-field search-field-narrow">
                    <label htmlFor="forecast-days">
                        <FaCalendarAlt /> Timeframe
                    </label>
                    <select
                        id="forecast-days"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="14">Last 14 Days</option>
                        <option value="30">Last 30 Days</option>
                    </select>
                </div>

                <button type="submit" className="search-btn" disabled={loading}>
                    <FaSearch />
                    {loading ? "Analyzing..." : "Search"}
                </button>
            </form>

            {/* --- YOUR LIVE FORECAST VIEW INSERTED HERE --- */}
            {forecastData && (
                <div className="forecast-meta">
                    Showing data for{" "}
                    <strong>{forecastData.meta.crop_name}</strong> in{" "}
                    <strong>{forecastData.meta.location}</strong> over the last{" "}
                    {forecastData.meta.lookback_period_days} days.
                </div>
            )}

            <div className="forecast-grid">
                {forecastData ? (
                    <>
                        {/* 1. Demand Volume Card */}
                        <div className="forecast-card">
                            <div className="crop-icon">{cropEmoji}</div>
                            <h4>{forecastData.meta.crop_name} Volume</h4>
                            <p
                                className={
                                    forecastData.demand_metrics.total_quantity_demanded > 150
                                        ? "high"
                                        : "medium"
                                }
                            >
                                Demand:{" "}
                                {forecastData.demand_metrics.total_quantity_demanded > 150
                                    ? "High"
                                    : "Medium"}
                            </p>
                            <small>
                                {forecastData.demand_metrics.total_quantity_demanded} kg Requested
                            </small>
                            <div className="forecast-detail-list">
                                <div>
                                    Total Pre-Orders:{" "}
                                    {forecastData.demand_metrics.total_pre_orders_placed}
                                </div>
                                <div>
                                    Unique Buyers:{" "}
                                    {forecastData.demand_metrics.unique_buyers_count}
                                </div>
                                <div>
                                    Avg. Order Size:{" "}
                                    {forecastData.demand_metrics.average_quantity_per_order} kg
                                </div>
                            </div>
                        </div>

                        {/* 2. Pricing Insights Card */}
                        <div className="forecast-card">
                            <div className="crop-icon">💰</div>
                            <h4>Market Pricing</h4>
                            <p className="price-highlight">
                                Avg: LKR {forecastData.pricing_insights.avg_pre_order_price}/kg
                            </p>
                            <small>Valuation Range</small>
                            <div className="forecast-detail-list">
                                <div>
                                    Min Price: LKR{" "}
                                    {forecastData.pricing_insights.min_pre_order_price}
                                </div>
                                <div>
                                    Max Price: LKR{" "}
                                    {forecastData.pricing_insights.max_pre_order_price}
                                </div>
                            </div>
                        </div>

                        {/* 3. Supply & Cultivation Card */}
                        <div className="forecast-card">
                            <div className="crop-icon">🧑‍🌾</div>
                            <h4>Local Supply Profile</h4>
                            <p className="low">
                                Farmers:{" "}
                                {forecastData.supply_cultivation_insights.active_farmers_count}{" "}
                                Active
                            </p>
                            <small>
                                {forecastData.supply_cultivation_insights.total_cultivated_area}{" "}
                                Acres Cultivated
                            </small>
                            <div className="forecast-detail-list">
                                <div>
                                    Avg Land Size:{" "}
                                    {
                                        forecastData.supply_cultivation_insights
                                            .average_cultivated_area_per_farmer
                                    }{" "}
                                    Ac
                                </div>
                                <div>
                                    Avg Stock / Farmer:{" "}
                                    {
                                        forecastData.supply_cultivation_insights
                                            .average_available_quantity_per_farmer
                                    }{" "}
                                    kg
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="forecast-empty">
                        <p>No forecast data available for this search.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
