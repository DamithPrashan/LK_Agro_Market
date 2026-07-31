import React from "react";
import "../../commonPages/csss/HomePage/overview.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";



function Overview() {
    const { t } = useTranslation();

    return (

        <div className="overview-container">

            <div className="overview-left">

                <h1>
                    {t("home.title")}
                </h1>

                <p className="sub-title">
                    {t("home.subtitle")}
                </p>

                <div className="overview-buttons">

                    <Link to="/login">
                        <button className="signin-btn">
                            {t("navbar.signIn")}
                        </button>
                    </Link>


                    <Link to="/register">
                        <button className="register-btn" >
                            {t("home.registerFree")}
                        </button>
                    </Link>

                </div>

            </div>


            <div className="overview-right">

                <div className="stat-card">

                    <h2>148</h2>

                    <p>{t("home.farmersStat")}</p>

                </div>

                <div className="stat-card">

                    <h2>62</h2>

                    <p>{t("home.listingsStat")}</p>

                </div>

                <div className="stat-card">

                    <h2>1.2K</h2>

                    <p>{t("home.ordersStat")}</p>

                </div>

            </div>

        </div>

    );

}

export default Overview;