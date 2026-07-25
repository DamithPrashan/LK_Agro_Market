import React from "react";
import { useTranslation } from "react-i18next";

import OverView from "../../components/HomePage/OverView.jsx";
import HeroCarousel from "../../components/HomePage/HeroCarousel.jsx";
import WorkCard from "../../components/HomePage/WorkCard.jsx";
import FeatureCards from "../../components/HomePage/FeatureCard.jsx";



import farmer from "../../assests/png/farmer.jpg";
import preorder from "../../assests/png/preorder.jpg";
import payment from "../../assests/png/payment.jpg";
import rating from "../../assests/png/ratings.jpg";

import "../csss/home.css";

function Home() {
const { t } = useTranslation();

const workSteps = [

{
title:"home.step1Title",
description:
"home.step1Desc",

image: farmer
},

{
title:"home.step2Title",
description:
"home.step2Desc",

image: preorder
},

{
title:"home.step3Title",
description:
"home.step3Desc",

image: payment
},

{
title:"home.step4Title",
description:
"home.step4Desc",

image: rating
}

];

return (

<div className="app">

<OverView />

<HeroCarousel />

<section className="how-section">

<h1 className="section-title">

{t("home.howItWorks")}

</h1>

{workSteps.map((step,index)=>(

<WorkCard
key={index}
title={t(step.title)}
description={t(step.description)}
image={step.image}
reverse={index%2!==0}
/>

))}

</section>

<FeatureCards />

</div>

);

}

export default Home;