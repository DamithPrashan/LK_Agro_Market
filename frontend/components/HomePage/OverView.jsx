import React from "react";
import "../../commonPages/csss/HomePage/overview.css";

function Overview() {

return (

<div className="overview-container">

<div className="overview-left">

<h1>
LK Agro Market — Platform Overview
</h1>

<p className="sub-title">
Sri Lanka's direct farm-to-buyer marketplace
</p>

<div className="overview-buttons">

<button className="signin-btn">
Sign In
</button>

<button className="register-btn">
Register Free
</button>

</div>

</div>


<div className="overview-right">

<div className="stat-card">

<h2>148</h2>

<p>Farmers</p>

</div>

<div className="stat-card">

<h2>62</h2>

<p>Listings</p>

</div>

<div className="stat-card">

<h2>1.2K</h2>

<p>Orders</p>

</div>

</div>

</div>

);

}

export default Overview;