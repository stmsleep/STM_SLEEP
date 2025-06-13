import React from "react";
import "../styles/LandingPage.css";

export default function LandingPage({ onNext }) {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Sleep Stage Detection</h1>
          <p className="hero-subtitle">
            A clinically-inspired solution to visualize and analyze biosignal data with precision.
          </p>
          <button className="start-button" onClick={onNext}>Start Visualizing</button>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose Us?</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <h3>👨‍⚕️ Clinical Precision</h3>
            <p>Engineered to reflect hospital-grade analysis of EOG, ECG, and SpO2 data.</p>
          </div>
          <div className="feature-item">
            <h3>⚡ Fast & Efficient</h3>
            <p>Optimized to handle millions of data points with instant chart rendering.</p>
          </div>
          <div className="feature-item">
            <h3>🔐 Private & Secure</h3>
            <p>Dropbox integration ensures secure, patient-first data handling and privacy.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <p>Signup and upload your files</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <p>We process and parse data (EOG, ECG, SpO2) on the backend</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <p>Visualize signals instantly and detect anomalies, stages, or patterns</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Trusted by Clinicians and Researchers</h2>
        <p>Start exploring your biosignals today</p>
        <button className="start-button" onClick={onNext}>Visualize Now</button>
      </section>
    </div>
  );
}
