import "../../csss/AdminDashboard/rating.css";

function RatingCard({title,rating}){

return(

<div className="rating-card">

<h3 className="rating-title">
{title}
</h3>

<h1 className="rating-value">
{rating}
</h1>

<div className="stars">

★★★★★

</div>

<p className="rating-text">

Average User Rating

</p>

</div>

)

}

export default RatingCard