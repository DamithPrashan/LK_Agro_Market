import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../../buyer/csss/PreOrder.css";
import { useCrops } from "../../../src/context/CropContext";

// local images map for fallback rendering
import tomatoImg from "../../assests/png/tomato.jpg";
import carrotImg from "../../assests/png/carrot.jpg";
import leeksImg from "../../assests/png/leeks.jpg";
import capsicumImg from "../../assests/png/capsicum.jpg";
import potatoImg from "../../assests/png/potato.jpg";
import greenBeansImg from "../../assests/png/beans.jpg";
import avocadoImg from "../../assests/png/avacado.jpg";
import beetrootImg from "../../assests/png/beatroot.jpg";
import grapesImg from "../../assests/png/grapes.jpg";
import pineappleImg from "../../assests/png/pineapple.jpg";
import pumpkinImg from "../../assests/png/pumpkin.jpg";
import bananaImg from "../../assests/png/banana.jpg";
import cabbageImg from "../../assests/png/cabbage.jpg";
import ladiesFingerImg from "../../assests/png/ladiesfinger.jpg";
import lemonImg from "../../assests/png/lemon.jpg";
import mangoImg from "../../assests/png/mango.jpg";
import onionImg from "../../assests/png/onion.jpg";
import watermelonImg from "../../assests/png/watermelon.jpg";
import brinjalImg from "../../assests/png/brinjal.jpg";
import cornImg from "../../assests/png/corn.jpg";

const imageMap = {
  "Tomato": tomatoImg,
  "Carrot": carrotImg,
  "Leeks": leeksImg,
  "Capsicum": capsicumImg,
  "Potato": potatoImg,
  "Green Beans": greenBeansImg,
  "Avocado": avocadoImg,
  "Beetroot": beetrootImg,
  "Grapes": grapesImg,
  "Pineapple": pineappleImg,
  "Pumpkin": pumpkinImg,
  "Banana": bananaImg,
  "Cabbage": cabbageImg,
  "Ladies Finger": ladiesFingerImg,
  "Lemon": lemonImg,
  "Mango": mangoImg,
  "Onion": onionImg,
  "Watermelon": watermelonImg,
  "Brinjal": brinjalImg,
  "Corn": cornImg
};

export default function CropDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { updateCropQuantity } = useCrops();

  // Determine which listing ID to load (defaulting to 1 if not specified)
  const cropId = id || location.state?.cropId || 1;

  const [cropData, setCropData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [dateError, setDateError] = useState("");

  const getMinMaxDates = () => {
    if (!cropData || !cropData.harvest) return { minStr: "", maxStr: "" };
    const minStr = cropData.harvest;
    const harvestDate = new Date(cropData.harvest);
    if (isNaN(harvestDate.getTime())) return { minStr: "", maxStr: "" };
    
    const maxDate = new Date(harvestDate);
    maxDate.setDate(maxDate.getDate() + 10);
    const yyyy = maxDate.getFullYear();
    const mm = String(maxDate.getMonth() + 1).padStart(2, '0');
    const dd = String(maxDate.getDate()).padStart(2, '0');
    const maxStr = `${yyyy}-${mm}-${dd}`;
    return { minStr, maxStr };
  };

  const { minStr: minDateStr, maxStr: maxDateStr } = getMinMaxDates();

  const validateDeliveryDate = (dateVal) => {
    if (!dateVal || !cropData || !cropData.harvest) {
      setDateError("");
      return true;
    }
    const { minStr, maxStr } = getMinMaxDates();
    if (!minStr || !maxStr) {
      setDateError("");
      return true;
    }
    if (dateVal < minStr) {
      setDateError(`Delivery date cannot be before the expected harvest date (${minStr}). This order is not possible.`);
      return false;
    }
    if (dateVal > maxStr) {
      setDateError(`Delivery date must be within 10 days of the expected harvest date (by ${maxStr}). Please choose an earlier date.`);
      return false;
    }
    setDateError("");
    return true;
  };

  // Fetch listing details from get_listings.php API
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/backend/get_listings.php?id=${cropId}`);
        const data = await response.json();
        
        if (data.success && data.crop) {
          setCropData(data.crop);
          
          // Determine initial main image
          if (data.crop.images && data.crop.images.length > 0) {
            let firstImg = data.crop.images[0];
            if (!firstImg.startsWith("http") && !firstImg.startsWith("/")) {
              firstImg = "/backend/" + firstImg;
            }
            setMainImage(firstImg);
          } else {
            const capitalized = data.crop.name ? data.crop.name.charAt(0).toUpperCase() + data.crop.name.slice(1).toLowerCase() : "";
            const resolvedLocalImage = imageMap[capitalized] || imageMap[data.crop.name];
            if (resolvedLocalImage) {
              setMainImage(resolvedLocalImage);
            } else if (data.crop.image_url) {
              let imgUrl = data.crop.image_url;
              if (!imgUrl.startsWith("http") && !imgUrl.startsWith("/")) {
                imgUrl = "/backend/" + imgUrl;
              }
              setMainImage(imgUrl);
            } else {
              setMainImage("https://images.unsplash.com/photo-1606787366850-de6330128bfc");
            }
          }
        } else {
          console.error("Listing loading failed: ", data.message);
        }
      } catch (err) {
        console.error("Failed to fetch crop detail: ", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [cropId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "#1a5c2d", fontSize: "18px", fontWeight: "bold" }}>
        Loading Listing Details...
      </div>
    );
  }

  if (!cropData) {
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "#e74c3c", fontSize: "18px", fontWeight: "bold" }}>
        Listing details could not be found. <button onClick={() => navigate("/browse")} style={{ marginLeft: "15px", padding: "8px 15px", borderRadius: "5px", background: "#1a5c2d", color: "white", border: "none", cursor: "pointer" }}>Back to Browse</button>
      </div>
    );
  }

  // Set up thumbnail carousel images
  const images = [];
  if (cropData.images && cropData.images.length > 0) {
    cropData.images.forEach((img) => {
      let url = img;
      if (!url.startsWith("http") && !url.startsWith("/")) {
        url = "/backend/" + url;
      }
      images.push(url);
    });
  } else {
    const capitalizedName = cropData.name ? cropData.name.charAt(0).toUpperCase() + cropData.name.slice(1).toLowerCase() : "";
    const localImage = imageMap[capitalizedName] || imageMap[cropData.name];
    if (localImage) {
      images.push(localImage);
    }
    if (cropData.image_url) {
      let imgUrl = cropData.image_url;
      if (!imgUrl.startsWith("http") && !imgUrl.startsWith("/")) {
        imgUrl = "/backend/" + imgUrl;
      }
      if (imgUrl !== localImage) {
        images.push(imgUrl);
      }
    }
    // Generic high-quality agricultural fallbacks to make a premium looking carousel
    images.push("https://images.unsplash.com/photo-1606787366850-de6330128bfc");
    images.push("https://images.unsplash.com/photo-1592924357228-91a4daadcfea");
    images.push("https://images.unsplash.com/photo-1582281298055-e25b84a5a2f4");
  }

  // Handle actual reservation submission
  const handlePreOrder = async (e) => {
    e.preventDefault();
    const qtyVal = parseFloat(quantity);
    const availableQty = parseFloat(cropData.qty);

    if (!quantity || qtyVal <= 0) {
      setSubmitMsg("Please enter a valid quantity.");
      return;
    }
    if (qtyVal > availableQty) {
      setSubmitMsg(`Requested quantity (${qtyVal} kg) exceeds available quantity (${availableQty} kg).`);
      return;
    }
    if (!deliveryDate) {
      setSubmitMsg("Please select a target delivery date.");
      return;
    }
    if (!validateDeliveryDate(deliveryDate)) {
      setSubmitMsg("Invalid target delivery date.");
      return;
    }
    
    setSubmitting(true);
    setSubmitMsg("");
    
    try {
      const response = await fetch("/backend/place_preorder.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crop_id: cropId,
          quantity: qtyVal,
          collection_date: deliveryDate,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSubmitMsg(`Success! Your pre-order request for ${qtyVal} kg has been received.`);
        
        const newQty = data.updated_quantity !== undefined ? data.updated_quantity : (parseFloat(cropData.qty) - qtyVal);
        
        // Update cropData.qty in state immediately without requiring page reload
        setCropData(prev => ({
          ...prev,
          qty: newQty
        }));

        // Also update shared CropContext so Browse page updates immediately
        updateCropQuantity(cropId, newQty);

        setQuantity("");
        setDeliveryDate("");
      } else {
        setSubmitMsg(data.message || "Failed to place pre-order.");
      }
    } catch (err) {
      setSubmitMsg("Failed to connect to the server.");
      console.error("Failed to place pre-order: ", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isOutOfStock = parseFloat(cropData.qty) <= 0;

  return (
    <div className="crop-container">
      {/* LEFT SIDE */}
      <div className="left-section">
        {/* Main Image */}
        <div className="main-image-box">
          <img src={mainImage} alt={cropData.name} />
        </div>

        {/* Thumbnails */}
        <div className="thumb-row">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt="thumb"
              className={mainImage === img ? "thumb active" : "thumb"}
              onClick={() => setMainImage(img)}
            />
          ))}
        </div>

        {/* Crop Info */}
        <div className="crop-info">
          <h1>{cropData.name}</h1>
          <h3>Rs. {parseFloat(cropData.price).toFixed(0)} per kg</h3>
          <p>
            Premium quality {cropData.name.toLowerCase()} fresh from the farms of {cropData.location}. 
            Grown under natural conditions using organic farming practices. High nutrients, rich taste, 
            and harvested fresh at maturity.
          </p>

          <div className="meta">
            <span>📍 District: {cropData.location}</span>
            <span style={{ color: isOutOfStock ? "#c0392b" : "inherit", fontWeight: isOutOfStock ? "bold" : "normal" }}>
              📦 Available Quantity: {isOutOfStock ? "Out of Stock" : `${parseFloat(cropData.qty).toFixed(0)} kg`}
            </span>
            <span>📅 Expected Harvest: {cropData.harvest}</span>
          </div>
          
          {/* Reviews List */}
          <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <h2 style={{ fontSize: "18px", color: "#1a5c2d", marginBottom: "15px" }}>Reviews ({cropData.reviews ? cropData.reviews.length : 0})</h2>
            {cropData.reviews && cropData.reviews.length > 0 ? (
              cropData.reviews.map((rev) => (
                <div key={rev.id} style={{ padding: "12px", background: "#f8f9fa", borderRadius: "6px", marginBottom: "10px", borderLeft: "4px solid #27ae60" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <strong>{rev.reviewer_name}</strong>
                    <span style={{ color: "#f1c40f" }}>{"★".repeat(rev.rating)}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>{rev.comment || "No comment left."}</p>
                  <span style={{ fontSize: "10px", color: "#999" }}>{rev.created_at}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#7f8c8d", fontSize: "14px", fontStyle: "italic" }}>No reviews posted for this farmer yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-section">
        {/* Farmer Card */}
        <div className="farmer-card">
          <h2>👨‍🌾 Farmer Profile</h2>

          <div className="farmer-info">
            <h3>{cropData.farmer_name}</h3>
            <p>⭐ {parseFloat(cropData.rating).toFixed(1)} Rating</p>
            <p>🏡 Farm Location: {cropData.farm_location || cropData.location}</p>
            <p>⏳ Verified Status: {parseInt(cropData.is_verified) === 1 ? "✓ Verified Farmer" : "Standard Listing"}</p>
            <p>📞 Contact: {cropData.farmer_phone || "077-XXXXXXX"}</p>
          </div>

          <button className="contact-btn" onClick={() => alert(`Contacting ${cropData.farmer_name} via ${cropData.farmer_email || "phone"}...`)}>
            Contact Farmer
          </button>
        </div>

        {/* Pre Order Box */}
        <div className="order-box" style={{ background: isOutOfStock ? "#34495e" : "#1b5e20" }}>
          <h2>{isOutOfStock ? "Out of Stock" : "Pre-Order Now"}</h2>
          <form onSubmit={handlePreOrder}>
            <label>Quantity (kg)</label>
            <input 
              type="number" 
              placeholder={isOutOfStock ? "Currently unavailable" : "Enter quantity"} 
              value={quantity} 
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={parseFloat(cropData.qty)}
              disabled={isOutOfStock}
              required
            />

            <label>Target Delivery Date</label>
            <input 
              type="date" 
              value={deliveryDate} 
              onChange={(e) => {
                const val = e.target.value;
                setDeliveryDate(val);
                validateDeliveryDate(val);
              }}
              min={minDateStr}
              max={maxDateStr}
              className={dateError ? "input-error" : ""}
              disabled={isOutOfStock}
              required
            />
            {dateError && (
              <span className="error-text" style={{ fontSize: "11px", color: "#e74c3c", marginTop: "4px", display: "block", fontWeight: "bold" }}>
                {dateError}
              </span>
            )}

            <button 
              type="submit" 
              className="order-btn" 
              disabled={submitting || !!dateError || isOutOfStock}
              style={{ background: isOutOfStock ? "#7f8c8d" : "#ff9800", cursor: isOutOfStock ? "not-allowed" : "pointer" }}
            >
              {isOutOfStock ? "Out of Stock" : (submitting ? "Processing..." : "Place Pre Order")}
            </button>
          </form>

          {submitMsg && (
            <div style={{ 
              marginTop: "15px", 
              padding: "12px 15px", 
              borderRadius: "8px", 
              fontSize: "13px", 
              fontWeight: "600",
              textAlign: "center", 
              background: submitMsg.toLowerCase().includes("success") ? "#d4edda" : "#f8d7da",
              color: submitMsg.toLowerCase().includes("success") ? "#155724" : "#721c24",
              border: `1px solid ${submitMsg.toLowerCase().includes("success") ? "#c3e6cb" : "#f5c6cb"}`
            }}>
              {submitMsg}
            </div>
          )}

          <p className="note">
            {isOutOfStock ? "Check back later when the farmer updates stock!" : "Secure your harvest before stock runs out 🌱"}
          </p>
        </div>
      </div>
    </div>
  );
}