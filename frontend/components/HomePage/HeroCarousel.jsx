import SliderDefault from "react-slick";
import { useTranslation } from "react-i18next";
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
    title:"home.carouselFreshCrops",
    desc:"home.carouselFreshCropsDesc"
  },
  {
    img:offer2,
    title:"home.carouselSpecialOffers",
    desc:"home.carouselSpecialOffersDesc"
  },
  {
    img:offer3,
    title:"home.carouselPreOrderCrops",
    desc:"home.carouselPreOrderCropsDesc"
  }
];

function HeroCarousel(){
  const { t } = useTranslation();

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
              <h1>{t(slide.title)}</h1>
              <p>{t(slide.desc)}</p>
            </div>
          </div>
        </div>
      ))}
    </Slider>
  )
}

export default HeroCarousel;