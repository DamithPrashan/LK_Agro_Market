import {
PieChart,
Pie,
Cell,
Tooltip,
Legend
} from "recharts";

import "../../csss/AdminDashboard/charts.css";

function DashboardCharts(){

const data=[

{
name:"New Farmers",
value:7
},

{
name:"New Buyers",
value:12
},

{
name:"Transactions",
value:34
},

{
name:"Complaints",
value:5
}

];

const colors=[
"#4caf50",
"#8bc34a",
"#ffb74d",
"#ef5350"
];

return(

<div className="chart-box">

<h2>This Week Summary</h2>

<PieChart
width={400}
height={300}
>

<Pie
data={data}
cx="50%"
cy="50%"
outerRadius={90}
dataKey="value"
label
>

{
data.map((entry,index)=>(

<Cell
key={index}
fill={colors[index]}
/>

))
}

</Pie>

<Tooltip/>

<Legend/>

</PieChart>

</div>

)

}

export default DashboardCharts;