import React from "react";

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

const workSteps = [

{
title:"1. Farmer Lists Crop",
description:
"Farmers can list crops during cultivation with expected harvest dates.",

image: farmer
},

{
title:"2. Buyer Pre-Orders",
description:
"Buyers can reserve crops early and secure orders before harvest.",

image: preorder
},

{
title:"3. Collect & Pay",
description:
"Collect products and complete secure payments through the platform.",

image: payment
},

{
title:"4. Rate Each Other",
description:
"Buyers and farmers rate each other to build trust.",

image: rating
}

];

return (

<div className="app">

<OverView />

<HeroCarousel />

<section className="how-section">

<h1 className="section-title">

How It Works

</h1>

{workSteps.map((step,index)=>(

<WorkCard
key={index}
title={step.title}
description={step.description}
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