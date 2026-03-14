import './AIModelsReport.css'

const AIModelsReport = () => (
  <div className="ai-models-page">
    <header className="ai-models-header">
      <div className="ai-models-header-content">
        <span className="ai-models-eyebrow">TerraSafe • Predictive Modeling</span>
        <h1>Grid Resilience Forecasting Models</h1>
        <p>
          TerraSafe employs a multi-model forecasting pipeline to predict grid failure probability
          under extreme weather scenarios. By integrating climate projections, infrastructure topology,
          and historical outage data, the platform produces county-level resilience scores that inform
          utility planning, emergency preparedness, and capital investment prioritization.
        </p>
        <div className="ai-models-highlight-grid">
          <div>
            <span className="highlight-label">Objective</span>
            <strong>Forecast grid failure and energy deficit risk at the county level</strong>
          </div>
          <div>
            <span className="highlight-label">Validation</span>
            <strong>County-holdout cross-validation with stratified risk segmentation</strong>
          </div>
          <div>
            <span className="highlight-label">Application</span>
            <strong>Actionable resilience intelligence for utility and emergency planners</strong>
          </div>
        </div>
      </div>
      <a className="ai-models-back" href="/">
        ← Back to Dashboard
      </a>
    </header>

    <section className="ai-models-section ai-models-card-grid">
      <article className="ai-models-card">
        <h2>Linear Regression Baseline</h2>
        <p>
          A multivariate linear regression model incorporating demographic flux indicators (birth/death
          rates, net migration), innovation indices, infrastructure degradation signals, and historical
          FEMA disaster declarations to establish a baseline energy deficit prediction.
        </p>
        <div className="ai-models-metric">
          <span>Validation Accuracy</span>
          <strong>81.4%</strong>
        </div>
        <ul>
          <li>High interpretability for regulatory and policy review</li>
          <li>Establishes performance floor for ensemble comparison</li>
          <li>Suitable for rapid initial assessment and triage</li>
        </ul>
      </article>

      <article className="ai-models-card">
        <h2>Terrain-Augmented Regression</h2>
        <p>
          Extends the baseline model by incorporating terrain slope and elevation data as proxies for
          infrastructure deployment cost and transmission line vulnerability. Elevated terrain correlates
          with reduced grid redundancy and increased maintenance burden, improving prediction accuracy
          in geographically constrained regions.
        </p>
        <div className="ai-models-metric">
          <span>Validation Accuracy</span>
          <strong>86.2%</strong>
        </div>
        <ul>
          <li>Captures topographic constraints on grid infrastructure</li>
          <li>Improves accuracy in mountainous and rural service territories</li>
          <li>Quantifies terrain as an infrastructure vulnerability proxy</li>
        </ul>
      </article>

      <article className="ai-models-card">
        <h2>Gradient Boosting Ensemble with Spatiotemporal Features</h2>
        <p>
          A gradient-boosted decision tree ensemble that augments the feature set with spatial clustering
          (grouping counties by geographic and risk similarity) and seasonal periodicity encodings. This
          architecture captures nonlinear interactions between climate patterns, grid topology, and
          demand cycles that linear models cannot represent.
        </p>
        <div className="ai-models-metric">
          <span>Validation Accuracy</span>
          <strong>89.7%</strong>
        </div>
        <ul>
          <li>Highest predictive performance across all evaluated architectures</li>
          <li>Effective for long-horizon resilience forecasting through 2050</li>
          <li>Generalizes across urban, suburban, and rural service territories</li>
        </ul>
      </article>
    </section>

    <section className="ai-models-section">
      <h2>Validation Methodology</h2>
      <div className="ai-models-accordion">
        <details open>
          <summary>County-holdout cross-validation</summary>
          <p>
            Model evaluation employs a county-holdout strategy in which entire counties are reserved
            for the test partition, preventing spatial data leakage. Performance is assessed across
            stratified risk tiers (high-risk, moderate-risk, and rural/underserved) to ensure
            equitable prediction quality across all population segments.
          </p>
        </details>
        <details>
          <summary>Missing data imputation strategy</summary>
          <p>
            Counties with incomplete feature coverage receive imputed values derived from regional
            medians and nearest-neighbor interpolation. Forecasts generated under imputation are
            flagged with reduced confidence indicators on the dashboard, enabling planners to
            distinguish between high-fidelity and estimated predictions.
          </p>
        </details>
        <details>
          <summary>Multi-source redundancy</summary>
          <p>
            The modeling pipeline ingests data from multiple independent sources to mitigate
            single-source failure risk. All prediction lineage is logged, providing full
            auditability from raw input through final county-level resilience scores.
          </p>
        </details>
      </div>
    </section>

    <section className="ai-models-section">
      <h2>Implementation & Reproducibility</h2>
      <p>
        The complete model training pipeline, including feature engineering, hyperparameter selection,
        and evaluation harness, is contained in <code>current_best_model.py</code>. All three model
        architectures are implemented within this module to facilitate independent verification and
        reproducibility of reported results.
      </p>
      <div className="ai-models-footer-grid">
        <div>
          <h3>Model Outputs</h3>
          <ul>
            <li>County-level grid failure probability scores</li>
            <li>Prediction confidence intervals and data completeness flags</li>
            <li>Ranked priority lists for intervention targeting</li>
          </ul>
        </div>
        <div>
          <h3>Impact Applications</h3>
          <ul>
            <li>Utility capacity planning and infrastructure hardening</li>
            <li>Rate case support and demand-response optimization</li>
            <li>Critical facility protection during extreme weather events</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
)

export default AIModelsReport
