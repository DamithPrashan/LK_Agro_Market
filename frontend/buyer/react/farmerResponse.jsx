import React, { useState } from "react";
import "../../buyer/csss/farmerResponse.css";

function FarmerResponse() {

    const [response, setResponse] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        alert("Response Submitted Successfully");
    };

    return (

        <div className="farmer-dashboard">

            <div className="response-card">

                <div className="response-header">

                    <div>

                        <h2>OPEN COMPLAINT #C019 — FARMER RESPONSE</h2>

                        <p>
                            Buyer says:
                            <span className="buyer-text">
                                "Received wilted leeks, weight short by 8 kg"
                            </span>
                        </p>

                    </div>

                    <span className="status-tag">
                        Under Review
                    </span>

                </div>

                <form onSubmit={handleSubmit}>

                    <label>Your Response</label>

                    <textarea
                        className="response-textarea"
                        rows="4"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Explain your response..."
                    />

                    <button
                        type="submit"
                        className="submit-btn"
                    >
                        Submit Response
                    </button>

                </form>

            </div>

        </div>

    );

}

export default FarmerResponse;