import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPlus, FaPen, FaTrashAlt, FaBoxOpen, FaLock } from "react-icons/fa";
import { getDistrictLabel } from "../../../src/constants/districtUtils";
import "../csss/dashBoard.css";

export default function MyListings() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [myCrops, setCrops] = useState([]);

    const fetchCrops = () => {
        fetch("/backend/Apis/farmer/crops/getCrops.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                setCrops(data);
            })
            .catch((err) => console.error("Error fetching crops:", err));
    };

    useEffect(() => {
        fetchCrops();
    }, []);

    const deleteCrop = async (cropId) => {
        const confirmDelete = window.confirm(
            t("confirmations.deleteListing")
        );

        if (!confirmDelete) return;

        try {
            const response = await fetch("/backend/Apis/farmer/crops/deleteCrop.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    crop_id: cropId,
                }),
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                fetchCrops();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error deleting crop:", error);
        }
    };

    const categoryMap = {
        "Vegetable": "farmer.categoryVegetable",
        "Vegetables": "farmer.categoryVegetable",
        "Fruit": "farmer.categoryFruit",
        "Fruits": "farmer.categoryFruit",
        "Grain": "farmer.categoryGrain",
        "Grains": "farmer.categoryGrain",
        "Other": "farmer.categoryOther"
    };

    const growthStageMap = {
        "planted": "farmer.stagePlanted",
        "growing": "farmer.stageGrowing",
        "ready_for_harvest": "farmer.stageReadyForHarvest",
        "harvested": "farmer.stageHarvested",
        "Planted": "farmer.stagePlanted",
        "Growing": "farmer.stageGrowing",
        "Ready for Harvest": "farmer.stageReadyForHarvest",
        "Harvested": "farmer.stageHarvested"
    };

    const statusMap = {
        "active": "listing.statusActive",
        "inactive": "listing.statusInactive",
        "pending": "listing.statusPending",
        "ACTIVE": "listing.statusActive",
        "INACTIVE": "listing.statusInactive",
        "PENDING": "listing.statusPending"
    };

    return (
        <div className="section" style={{ margin: "20px 0" }}>
            <div className="section-header">
                <h3>{t("sidebar.myListings")}</h3>
                <button
                    className="add-btn"
                    onClick={() => navigate("/farmer/add-listing")}
                >
                    <FaPlus /> {t("buttons.addCrop")}
                </button>
            </div>

            {myCrops.length > 0 ? (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>{t("farmer.tableCrop")}</th>
                                <th>{t("farmer.tableCategory")}</th>
                                <th>{t("farmer.tableQuantity")}</th>
                                <th>{t("farmer.tableLocation")}</th>
                                <th>{t("farmer.tableGrowthStage")}</th>
                                <th>{t("farmer.tablePrice")}</th>
                                <th>{t("farmer.tableHarvestDate")}</th>
                                <th>{t("farmer.tableStatus", "Status")}</th>
                                <th>{t("farmer.tableAction")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myCrops.map((crop) => (
                                <tr key={crop.crop_id}>
                                    <td data-label={t("farmer.tableCrop")}>{crop.crop_name}</td>
                                    <td data-label={t("farmer.tableCategory")}>{t(categoryMap[crop.category] || crop.category, crop.category)}</td>
                                    <td data-label={t("farmer.tableQuantity")}>{crop.quantity} kg</td>
                                    <td data-label={t("farmer.tableLocation")}>{getDistrictLabel(t, crop.location)}</td>
                                    <td data-label={t("farmer.tableGrowthStage")}>{t(growthStageMap[crop.growth_stage] || crop.growth_stage, crop.growth_stage)}</td>
                                    <td data-label={t("farmer.tablePrice")}>Rs.{crop.price_per_unit}</td>
                                    <td data-label={t("farmer.tableHarvestDate")}>{crop.harvest_date}</td>
                                    <td data-label={t("farmer.tableStatus", "Status")}>
                                        <span className={`status-badge ${crop.crop_status}`}>{t(statusMap[crop.crop_status] || crop.crop_status, crop.crop_status)}</span>
                                    </td>
                                    <td data-label={t("farmer.tableAction")}>
                                        <div className="row-actions">
                                            {crop.has_active_orders ? (
                                                <button
                                                    className="edit-btn"
                                                    disabled
                                                    title={t("farmer.editDisabledActiveOrders")}
                                                    style={{
                                                        opacity: 0.45,
                                                        cursor: "not-allowed",
                                                        pointerEvents: "all",
                                                    }}
                                                >
                                                    <FaLock /> {t("buttons.edit")}
                                                </button>
                                            ) : (
                                                <button
                                                    className="edit-btn"
                                                    onClick={() =>
                                                        navigate("/farmer/edit-listing", {
                                                            state: {
                                                                crop_id: crop.crop_id,
                                                                cropName: crop.crop_name,
                                                                category: crop.category,
                                                                quantity: crop.quantity,
                                                                location: crop.location,
                                                                harvestDate: crop.harvest_date,
                                                                price: crop.price_per_unit,
                                                                stage: crop.growth_stage,
                                                            },
                                                        })
                                                    }
                                                >
                                                    <FaPen /> {t("buttons.edit")}
                                                </button>
                                            )}
                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteCrop(crop.crop_id)}
                                            >
                                                <FaTrashAlt /> {t("buttons.delete")}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <FaBoxOpen />
                    <p>{t("emptyStates.noListings")}</p>
                    <button
                        className="add-btn"
                        onClick={() => navigate("/farmer/add-listing")}
                    >
                        <FaPlus /> {t("farmer.addFirstCrop")}
                    </button>
                </div>
            )}
        </div>
    );
}

