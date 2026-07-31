import React from "react";
import "../csss/dashBoard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    FaTimes,
    FaSeedling,
    FaClipboardList,
    FaExclamationCircle,
    FaCheck,
} from "react-icons/fa";
import DemandForecast from "./demandForecast";
import { useAuth } from "../../../src/context/AuthContext";
import HeroCarousel from "../../components/HeroCarousel/HeroCarousel";
import farmer1 from "../../assests/png/buyer1.jpg";
import farmer2 from "../../assests/png/buyer2.jpg";
import farmer3 from "../../assests/png/buyer3.jpg";

function DashBoard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [myCrops, setCrops] = useState([]);
    const [incomingOrders, setIncomingOrders] = useState([]);

    const getWelcomeMsg = () => {
        if (!user) return "";
        const key = `hasLoggedIn_${user.id}`;
        if (localStorage.getItem(key)) {
            return t("farmerDashboard.welcomeBack", { name: user.name });
        } else {
            // Set first log in flag if not present
            localStorage.setItem(key, "true");
            return t("farmerDashboard.welcomeNew", { name: user.name });
        }
    };

    const fetchCrops = () => {
        fetch("/backend/getCrops.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                setCrops(data);
            })
            .catch((err) => console.error("Error fetching crops:", err));
    };

    const fetchIncomingOrders = () => {
        fetch("/backend/get_farmer_orders.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    setIncomingOrders(data.orders.filter((o) => o.status === "Pending"));
                }
            })
            .catch((err) => console.error("Error fetching incoming orders:", err));
    };

    const handleOrderAction = async (orderId, action) => {
        try {
            const res = await fetch("/backend/update_order_status.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    order_id: orderId,
                    action: action,
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchIncomingOrders();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert(t("errors.submissionFailed"));
        }
    };

    useEffect(() => {
        fetchCrops();
        fetchIncomingOrders();
    }, []);

    return (
        <div className="dashboard">
            <div className="content">
                {/* Header */}
                <section className="hero" style={{ marginBottom: "28px" }}>
                    <HeroCarousel images={[farmer1, farmer2, farmer3]}>
                        <h1>{getWelcomeMsg()}</h1>
                        <p>{t("farmerDashboard.subtitle")}</p>
                    </HeroCarousel>
                </section>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card green" onClick={() => navigate("/farmer/listings")}>
                        <div className="stat-icon">
                            <FaSeedling />
                        </div>
                        <div className="stat-body">
                            <h4>{t("stats.activeListings")}</h4>
                            <h2>
                                {
                                    myCrops.filter((c) => c.crop_status === "active")
                                        .length
                                }
                            </h2>
                            <p>{t("buttons.view")} {t("sidebar.myListings").toLowerCase()}</p>
                        </div>
                    </div>

                    <div className="stat-card blue" onClick={() => navigate("/farmer/orders")}>
                        <div className="stat-icon">
                            <FaClipboardList />
                        </div>
                        <div className="stat-body">
                            <h4>{t("stats.pendingOrders")}</h4>
                            <h2>{incomingOrders.length}</h2>
                            <p>{t("buttons.view")} {t("sidebar.myOrders").toLowerCase()}</p>
                        </div>
                    </div>

                    <div className="stat-card red" onClick={() => navigate("/complaints")}>
                        <div className="stat-icon">
                            <FaExclamationCircle />
                        </div>
                        <div className="stat-body">
                            <h4>{t("stats.complaints")}</h4>
                            <h2>0</h2>
                            <p>{t("buttons.view")} {t("sidebar.complaints").toLowerCase()}</p>
                        </div>
                    </div>
                </div>


                <DemandForecast />

                {/* Orders */}
                <div className="orders-section-container" style={{ marginTop: "25px" }}>
                    <div className="section orders-section">
                        <h3>{t("farmerDashboard.incomingOrders")}</h3>
                        {incomingOrders.length > 0 ? (
                            <div className="orders-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "15px" }}>
                                {incomingOrders.map((order) => (
                                    <div className="order-card" key={order.id} style={{ marginTop: 0 }}>
                                        <div className="order-card-header">
                                            <span className="order-buyer">{order.buyer}</span>
                                            <span className="order-badge">{t("orders.status.pending")}</span>
                                        </div>
                                        <p>
                                            <b>{t("farmer.cropLabel")}</b> {order.crop}
                                        </p>
                                        <p>
                                            <b>{t("farmer.quantityLabel")}</b> {order.quantity}
                                        </p>
                                        <p>
                                            <b>{t("farmer.collectionLabel")}</b> {order.date}
                                        </p>

                                        <div className="buttons">
                                            <button
                                                className="accept"
                                                onClick={() =>
                                                    handleOrderAction(order.db_id, "accept")
                                                }
                                            >
                                                <FaCheck /> {t("buttons.accept")}
                                            </button>
                                            <button
                                                className="decline"
                                                onClick={() =>
                                                    handleOrderAction(order.db_id, "decline")
                                                }
                                            >
                                                <FaTimes /> {t("buttons.decline")}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state small">
                                <FaClipboardList />
                                <p>{t("farmerDashboard.noIncomingOrders")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashBoard;

