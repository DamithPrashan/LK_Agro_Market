import React, { useState, useEffect } from 'react';

export default function ForecastDashboard() {
    // Component Search States
    const [cropName, setCropName] = useState('carrot');
    const [location, setLocation] = useState('Ratnapura');
    const [days, setDays] = useState(7);

    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch call directly interacting with your live PHP development server endpoint
    const fetchForecast = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/backend/get_demand_forecast.php?crop_name=${cropName}&location=${location}&days=${days}`);
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

    return (
        <div className="dashboard-container" style={{ padding: '20px' }}>

            {/* Simple Dashboard Controls Filter Panel */}
            <div className="filter-panel" style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                <input type="text" value={cropName} onChange={e => setCropName(e.target.value)} placeholder="Crop (e.g. carrot)" />
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />
                <select value={days} onChange={e => setDays(e.target.value)}>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                </select>
                <button onClick={fetchForecast} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                    {loading ? 'Analyzing...' : 'Search'}
                </button>
            </div>

            {/* --- YOUR LIVE FORECAST VIEW INSERTED HERE --- */}
            <div className="section">
                <h3>DEMAND FORECAST & ANALYSIS</h3>

                {forecastData && (
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                        Showing data for <strong style={{ textTransform: 'capitalize' }}>{forecastData.meta.crop_name}</strong> in <strong style={{ textTransform: 'capitalize' }}>{forecastData.meta.location}</strong> over the last {forecastData.meta.lookback_period_days} Days.
                    </div>
                )}

                <div className="forecast-grid">
                    {forecastData ? (
                        <>
                            {/* 1. Demand Volume Card */}
                            <div className="forecast-card">
                                <div className="crop-icon">
                                    {forecastData.meta.crop_name.toLowerCase() === 'tomato' ? '🍅' :
                                        forecastData.meta.crop_name.toLowerCase() === 'carrot' ? '🥕' : '🫘'}
                                </div>
                                <h4 style={{ textTransform: 'capitalize' }}>{forecastData.meta.crop_name} Volume</h4>
                                <p className={forecastData.demand_metrics.total_quantity_demanded > 150 ? "high" : "medium"}>
                                    Demand: {forecastData.demand_metrics.total_quantity_demanded > 150 ? "High" : "Medium"}
                                </p>
                                <small>{forecastData.demand_metrics.total_quantity_demanded} kg Requested</small>
                                <div style={{ fontSize: '11px', marginTop: '8px', color: '#555', textAlign: 'left', lineHeight: '1.6' }}>
                                    <div>• Total Pre-Orders: {forecastData.demand_metrics.total_pre_orders_placed}</div>
                                    <div>• Unique Buyers: {forecastData.demand_metrics.unique_buyers_count}</div>
                                    <div>• Avg. Order Size: {forecastData.demand_metrics.average_quantity_per_order} kg</div>
                                </div>
                            </div>

                            {/* 2. Pricing Insights Card */}
                            <div className="forecast-card">
                                <div className="crop-icon">💰</div>
                                <h4>Market Pricing</h4>
                                <p className="medium" style={{ color: '#d97706' }}>Avg: LKR {forecastData.pricing_insights.avg_pre_order_price}/kg</p>
                                <small>Valuation Range</small>
                                <div style={{ fontSize: '11px', marginTop: '8px', color: '#555', textAlign: 'left', lineHeight: '1.6' }}>
                                    <div>• Min Price: LKR {forecastData.pricing_insights.min_pre_order_price}</div>
                                    <div>• Max Price: LKR {forecastData.pricing_insights.max_pre_order_price}</div>
                                </div>
                            </div>

                            {/* 3. Supply & Cultivation Card */}
                            <div className="forecast-card">
                                <div className="crop-icon">🧑‍🌾</div>
                                <h4>Local Supply Profile</h4>
                                <p className="low" style={{ color: '#059669' }}>
                                    Farmers: {forecastData.supply_cultivation_insights.active_farmers_count} Active
                                </p>
                                <small>{forecastData.supply_cultivation_insights.total_cultivated_area} Acres Cultivated</small>
                                <div style={{ fontSize: '11px', marginTop: '8px', color: '#555', textAlign: 'left', lineHeight: '1.6' }}>
                                    <div>• Avg Land Size: {forecastData.supply_cultivation_insights.average_cultivated_area_per_farmer} Ac</div>
                                    <div>• Avg Stock / Farmer: {forecastData.supply_cultivation_insights.average_available_quantity_per_farmer} kg</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="forecast-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                            <p>No forecast data available.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}