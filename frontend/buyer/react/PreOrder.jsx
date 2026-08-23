import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../../buyer/csss/PreOrder.css";
import { useCrops } from "../../../src/context/CropContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../src/context/AuthContext";
import ReviewModal from "../../components/ReviewModal";
import { getDistrictLabel } from "../../../src/constants/districtUtils";

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
  const { t } = useTranslation();
  const { user } = useAuth();

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
  const [showFarmerReviews, setShowFarmerReviews] = useState(false);
  const [guestAuthNotice, setGuestAuthNotice] = useState(false);

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
      setDateError(t("errors.deliveryBeforeHarvest", { date: minStr }));
      return false;
    }
    if (dateVal > maxStr) {
      setDateError(t("errors.deliveryDaysLimit", { date: maxStr }));
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
        {t("loadingStates.loadingDetails", "Loading Listing Details...")}
      </div>
    );
  }

  if (!cropData) {
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "#e74c3c", fontSize: "18px", fontWeight: "bold" }}>
        {t("errors.listingNotFound")} <button onClick={() => navigate("/browse")} style={{ marginLeft: "15px", padding: "8px 15px", borderRadius: "5px", background: "#1a5c2d", color: "white", border: "none", cursor: "pointer" }}>{t("buttons.back")}</button>
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
  }

  // Handle actual reservation submission
  const handlePreOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      setGuestAuthNotice(true);
      return;
    }
    const qtyVal = parseFloat(quantity);
    const availableQty = parseFloat(cropData.qty);

    if (!quantity || qtyVal <= 0) {
      setSubmitMsg(t("errors.invalidQuantity"));
      return;
    }
    if (qtyVal > availableQty) {
      setSubmitMsg(t("errors.qtyExceedsAvailable", { qty: qtyVal, available: availableQty }));
      return;
    }
    if (!deliveryDate) {
      setSubmitMsg(t("errors.selectDeliveryDate"));
      return;
    }
    if (!validateDeliveryDate(deliveryDate)) {
      setSubmitMsg(t("errors.invalidDeliveryDate"));
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
        setSubmitMsg(t("errors.preOrderSuccess", { defaultValue: `Success! Your pre-order request for ${qtyVal} kg has been received.`, qty: qtyVal }));

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
        setSubmitMsg(data.message || t("errors.submissionFailed"));
      }
    } catch (err) {
      setSubmitMsg(t("errors.connectionFailed"));
      console.error("Failed to place pre-order: ", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isOutOfStock = parseFloat(cropData.qty) <= 0;

  return (
    <div className="crop-container">
      <button type="button" className="crop-detail-back" onClick={() => navigate(user ? "/browse" : "/#market")}>← {user ? t("homepage.backMarketplace") : t("homepage.backHome")}</button>
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
              alt={t("cropThumbnail", "Thumbnail")}
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
            {t("buyerDashboard.cropDescriptionTemplate", {
               defaultValue: "Premium quality {{crop}} fresh from the farms of {{location}}. Grown under natural conditions using organic farming practices. High nutrients, rich taste, and harvested fresh at maturity.",
               crop: cropData.name.toLowerCase(),
               location: getDistrictLabel(t, cropData.location)
            })}
          </p>

          <div className="meta">
            <span>📍 {t("forms.location")}: {getDistrictLabel(t, cropData.location)}</span>
            <span style={{ color: isOutOfStock ? "#c0392b" : "inherit", fontWeight: isOutOfStock ? "bold" : "normal" }}>
              📦 {t("forms.quantity")}: {isOutOfStock ? t("emptyStates.outOfStock") : `${parseFloat(cropData.qty).toFixed(0)} kg`}
            </span>
            <span>📅 {t("forms.harvestDate")}: {cropData.harvest}</span>
          </div>

          {/* Reviews List */}
          <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <h2 style={{ fontSize: "18px", color: "#1a5c2d", marginBottom: "15px" }}>{t("buyerDashboard.reviews", { count: cropData.reviews ? cropData.reviews.length : 0 })}</h2>
            {cropData.reviews && cropData.reviews.length > 0 ? (
              cropData.reviews.map((rev) => (
                <div key={rev.id} style={{ padding: "12px", background: "#f8f9fa", borderRadius: "6px", marginBottom: "10px", borderLeft: "4px solid #27ae60" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <strong>{rev.reviewer_name}</strong>
                    <span style={{ color: "#f1c40f" }}>{"★".repeat(rev.rating)}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>{rev.comment || t("emptyStates.noReviewsComment")}</p>
                  <span style={{ fontSize: "10px", color: "#999" }}>{rev.created_at}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#7f8c8d", fontSize: "14px", fontStyle: "italic" }}>{t("emptyStates.noReviews")}</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-section">
        {/* Farmer Card */}
        <div className="farmer-card">
          <h2>{t("buyerDashboard.farmerProfile")}</h2>

          <div className="farmer-info">
            <h3>{cropData.farmer_name}</h3>
            <p>⭐ {parseFloat(cropData.rating).toFixed(1)} {t("buyerDashboard.rating", "Rating")}</p>
            <p>{t("buyerDashboard.farmLocation", { location: cropData.farm_location || cropData.location })}</p>
            <p>{t("buyerDashboard.verifiedStatus")}{parseInt(cropData.is_verified) === 1 ? t("buyerDashboard.verifiedFarmer") : t("buyerDashboard.standardListing")}</p>
            <p>{t("buyerDashboard.contact", { phone: cropData.farmer_phone || "077-XXXXXXX" })}</p>
          </div>

          <button className="contact-btn" onClick={() => alert(t("buyerDashboard.contactingFarmer", { name: cropData.farmer_name, channel: cropData.farmer_email || "phone" }))}>
            {t("buttons.contactFarmer")}
          </button>

          <button 
              className="view-reviews-btn"
              style={{
                  background: "#f1f2f6",
                  border: "1px solid #ced6e0",
                  color: "#2f3542",
                  padding: "10px 15px",
                  borderRadius: "5px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  width: "100%",
                  marginTop: "10px",
                  transition: "background 0.2s"
              }}
              onClick={() => setShowFarmerReviews(true)}
          >
              👁️ {t("buttons.viewReviews", "View Reviews")}
          </button>
        </div>

        {/* Pre Order Box */}
        <div className="order-box" style={{ background: isOutOfStock ? "#34495e" : "#1b5e20" }}>
          <h2>{isOutOfStock ? t("emptyStates.outOfStock") : t("buyerDashboard.preOrderNow")}</h2>
          {guestAuthNotice && <div className="guest-auth-notice"><p>{t("homepage.cropAuthMessage")}</p><div><button type="button" onClick={() => navigate("/register?role=buyer")}>{t("homepage.registerBuyer")}</button><button type="button" onClick={() => navigate("/login")}>{t("homepage.signIn")}</button></div></div>}
          <form onSubmit={handlePreOrder}>
            <label>{t("forms.quantity")}</label>
            <input
              type="number"
              placeholder={isOutOfStock ? t("buyerDashboard.currentlyUnavailable") : t("buyerDashboard.enterQuantity")}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={parseFloat(cropData.qty)}
              disabled={isOutOfStock}
              required
            />

            <label>{t("forms.targetDeliveryDate")}</label>
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
              {isOutOfStock ? t("emptyStates.outOfStock") : (submitting ? t("buttons.processing", "Processing...") : t("buttons.placePreOrder"))}
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
            {isOutOfStock ? t("buyerDashboard.checkBackLater") : t("buyerDashboard.secureHarvest")}
          </p>
        </div>
      </div>
      {showFarmerReviews && (
        <ReviewModal
          userId={cropData.farmer_user_id}
          userName={cropData.farmer_name}
          userLocation={cropData.farm_location || cropData.location}
          userRole="farmer"
          onClose={() => setShowFarmerReviews(false)}
        />
      )}
    </div>
  );
}
