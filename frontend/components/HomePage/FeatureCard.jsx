import React from "react";
import { useTranslation } from "react-i18next";
import "../../commonPages/csss/HomePage/featurecards.css";

import { FaUserCheck } from "react-icons/fa";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { FaBalanceScale } from "react-icons/fa";

function FeatureCards() {

const { t } = useTranslation();

const features=[

{
icon:<FaUserCheck />,
title:"home.featureVerified",
description:
"home.featureVerifiedDesc"
},

{
icon:<FaMoneyCheckAlt />,
title:"home.featureSecure",
description:
"home.featureSecureDesc"
},

{
icon:<FaBalanceScale />,
title:"home.featureDispute",
description:
"home.featureDisputeDesc"
}

];

return (

<div className="feature-container">

{features.map((item,index)=>(

<div className="feature-card" key={index}>

<div className="feature-icon">
{item.icon}
</div>

<h3>{t(item.title)}</h3>

<p>{t(item.description)}</p>

</div>

))}

</div>

);

}

export default FeatureCards;