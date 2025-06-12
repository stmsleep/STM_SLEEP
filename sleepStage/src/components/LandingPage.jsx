export default function LandingPage({onNext}){
    return(
        <div>
            <h1>LandingPage</h1>
            <div style={{ textAlign: "center", marginTop: "30px" }}>
                <button className="visualize-button" onClick={onNext}>
                Go to Visualize
                </button>
            </div>
        </div>
    );
}