import { useEffect, useState } from "react";

import "../../commonPages/csss/HomePage/FeaturedCrops.css";

import tomato from "../../../src/assets/tomato.png";
import carrot from "../../../src/assets/carrot.png";
import cabbage from "../../../src/assets/cabbage.png";
import potato from "../../../src/assets/potato.png";

import {
  FaMapMarkerAlt,
  FaFire,
} from "react-icons/fa";


const cropImages = {
  tomato: tomato,
  carrot: carrot,
  cabbage: cabbage,
  potato: potato,
};


export default function FeaturedCrops() {

  const [crops, setCrops] = useState([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    const loadTrendingCrops =
      async () => {

        try {

          const response =
            await fetch(
              "/backend/Apis/get_weekly_trending_crops.php"
            );

          const result =
            await response.json();


          if (result.success) {

            setCrops(
              result.data || []
            );

          }

        } catch (error) {

          console.error(
            "Failed to load trending crops:",
            error
          );

        } finally {

          setLoading(false);

        }

      };


    loadTrendingCrops();

  }, []);


  return (

    <section className="featured-crops">

      <div className="featured-container">


        <div className="featured-header">

          <h2>
            Weekly Trending Crops
          </h2>

        </div>


        {loading ? (

          <p>Loading trending crops...</p>

        ) : (

          <div className="featured-grid">

            {crops.map((crop) => {

              const cropKey =
                crop.crop_name
                  .toLowerCase()
                  .trim();


              const cropImage =
                cropImages[cropKey];


              return (

                <article
                  className="featured-card"
                  key={crop.crop_name}
                >


                  <div className="featured-image-wrap">

                    <img
                      src={cropImage}
                      alt={crop.crop_name}
                    />


                    <div className="featured-verified">

                      <FaFire />

                      <span>
                        Trending
                      </span>

                    </div>

                  </div>


                  <div className="featured-card-body">


                    <h3>
                      {crop.crop_name}
                    </h3>


                    <div className="featured-meta">

                      <div className="featured-location">

                        <FaMapMarkerAlt />

                        <span>
                          {crop.district}
                        </span>

                      </div>

                    </div>


                    <div className="featured-divider">
                    </div>


                    <div className="featured-price">

                      <span className="featured-price-main">

                        Rs.{" "}

                        {Number(
                          crop.average_price
                        ).toLocaleString()}

                      </span>


                      <span className="featured-price-unit">
                        /kg
                      </span>

                    </div>


                  </div>

                </article>

              );

            })}

          </div>

        )}

      </div>

    </section>

  );
}