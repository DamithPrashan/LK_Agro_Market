import React from "react";
import "../../commonPages/csss/HomePage/featurecards.css";

import { FaUserCheck } from "react-icons/fa";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { FaBalanceScale } from "react-icons/fa";

function FeatureCards() {

const features=[

{
icon:<FaUserCheck />,
title:"Verified Farmers",
description:
"NIC-checked and location-verified farmers earn trusted badges before listing."
},

{
icon:<FaMoneyCheckAlt />,
title:"Secure Payments",
description:
"Secure pre-payments and balance collection via Bank and Lanka QR."
},

{
icon:<FaBalanceScale />,
title:"Dispute Resolution",
description:
"Admin-managed complaint handling for fair resolution of every order."
}

];

return (

<div className="feature-container">

{features.map((item,index)=>(

<div className="feature-card" key={index}>

<div className="feature-icon">
{item.icon}
</div>

<h3>{item.title}</h3>

<p>{item.description}</p>

</div>

))}

</div>

);

}

export default FeatureCards;