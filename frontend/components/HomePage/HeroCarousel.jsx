import SliderDefault from "react-slick";
const Slider = SliderDefault?.default || SliderDefault;

import offer1 from "../../assests/png/offer1.jpg";
import offer2 from "../../assests/png/offer2.jpg";
import offer3 from "../../assests/png/offer3.jpg";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../../commonPages/csss/HomePage/carousel.css";

const slides=[

{
img:offer1,
title:"Fresh Crops",
desc:"Direct from Sri Lankan farms"
},

{
img:offer2,
title:"Special Offers",
desc:"Best harvest deals"
},

{
img:offer3,
title:"Pre Order Crops",
desc:"Reserve before harvest"
}

];

function HeroCarousel(){

const settings={

dots:true,
infinite:true,
autoplay:true,
autoplaySpeed:2000,
arrows:false,

};

return(

<Slider {...settings}>

{slides.map((slide,index)=>(

<div key={index}>

<div
className="slide"
style={{
backgroundImage:`url(${slide.img})`
}}
>

<div className="overlay">

<h1>{slide.title}</h1>

<p>{slide.desc}</p>

</div>

</div>

</div>

))}

</Slider>

)

}

export default HeroCarousel;