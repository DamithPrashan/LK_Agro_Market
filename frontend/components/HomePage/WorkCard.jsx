import { motion } from "framer-motion";
import "../../commonPages/csss/HomePage/workcard.css";

function WorkCard({image,title,description,reverse}){

return(

<motion.div
className={`work-card ${reverse?"reverse":""}`}
whileHover={{scale:1.03}}
initial={{opacity:0,y:50}}
// animate={{
// opacity:1,
// y:0
// }}
whileInView={{opacity:1,y:0}}
transition={{duration:.7}}
>

<img src={image}/>

<div className="work-content">

<h2>{title}</h2>

<p>{description}</p>

</div>

</motion.div>

)

}

export default WorkCard;