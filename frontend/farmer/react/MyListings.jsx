import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaPen, FaTrashAlt, FaBoxOpen } from "react-icons/fa";
import "../csss/dashBoard.css";

export default function MyListings() {
    const navigate = useNavigate();
    const [myCrops, setCrops] = useState([]);

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

    useEffect(() => {
        fetchCrops();
    }, []);

    const deleteCrop = async (cropId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this listing?"
        );

        if (!confirmDelete) return;

        try {
            const response = await fetch("/backend/deleteCrop.php", {
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

    return (
        <div className="section" style={{ margin: "20px 0" }}>
            <div className="section-header">
                <h3>My Listings</h3>
                <button
                    className="add-btn"
                    onClick={() => navigate("/farmer/add-listing")}
                >
                    <FaPlus /> Add Crop
                </button>
            </div>

            {myCrops.length > 0 ? (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Crop</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Location</th>
                                <th>Growth Stage</th>
                                <th>Price / Kg</th>
                                <th>Harvest Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myCrops.map((crop) => (
                                <tr key={crop.crop_id}>
                                    <td data-label="Crop">{crop.crop_name}</td>
                                    <td data-label="Category">{crop.category}</td>
                                    <td data-label="Quantity">{crop.quantity} kg</td>
                                    <td data-label="Location">{crop.location}</td>
                                    <td data-label="Growth Stage">{crop.growth_stage}</td>
                                    <td data-label="Price / Kg">Rs.{crop.price_per_unit}</td>
                                    <td data-label="Harvest Date">{crop.harvest_date}</td>
                                    <td data-label="Action">
                                        <div className="row-actions">
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
                                                <FaPen /> Edit
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteCrop(crop.crop_id)}
                                            >
                                                <FaTrashAlt /> Delete
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
                    <p>You don't have any crop listings yet.</p>
                    <button
                        className="add-btn"
                        onClick={() => navigate("/farmer/add-listing")}
                    >
                        <FaPlus /> Add your first crop
                    </button>
                </div>
            )}
        </div>
    );
}
