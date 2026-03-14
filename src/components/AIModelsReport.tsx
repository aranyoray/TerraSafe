import './AIModelsReport.css'

const AIModelsReport = () => (
  <div className="ai-models-page">
    <header className="ai-models-header">
      <div className="ai-models-header-content">
        <span className="ai-models-eyebrow">EnerGency • Models Report</span>
        <h1>Forecast Models for Energy Planning</h1>
        <p>
          This page shows the three different models I built for EnerGency. Each one tries to predict
          energy shortages and emergency situations using different techniques I learned about.
        </p>
        <div className="ai-models-highlight-grid">
          <div>
            <span className="highlight-label">What it does</span>
            <strong>Predicts energy deficits and emergency risk</strong>
          </div>
          <div>
            <span className="highlight-label">Testing Method</span>
            <strong>Split data by county for testing</strong>
          </div>
          <div>
            <span className="highlight-label">Goal</span>
            <strong>Make results easy to understand and use</strong>
          </div>
        </div>
      </div>
      <a className="ai-models-back" href="/">
        ← Back to Dashboard
      </a>
    </header>

    <section className="ai-models-section ai-models-card-grid">
      <article className="ai-models-card">
        <h2>Model 1: Basic Regression</h2>
        <p>
          This is a simple linear regression model that looks at things like innovation, birth/death rates,
          migration, infrastructure problems, and past disasters to predict energy shortages.
        </p>
        <div className="ai-models-metric">
          <span>Test Accuracy</span>
          <strong>81.4%</strong>
        </div>
        <ul>
          <li>Easy to understand and explain</li>
          <li>Good starting point for predictions</li>
          <li>Works well for basic planning</li>
        </ul>
      </article>

      <article className="ai-models-card">
        <h2>Model 2: Adding Slope Data</h2>
        <p>
          This model takes the first one and adds terrain slope information. The idea is that hills
          and mountains make it harder to build power infrastructure, so areas with steep slopes might
          have more energy problems.
        </p>
        <div className="ai-models-metric">
          <span>Test Accuracy</span>
          <strong>86.2%</strong>
        </div>
        <ul>
          <li>Better predictions in mountainous areas</li>
          <li>Accounts for geography affecting power lines</li>
          <li>More accurate than just the basic model</li>
        </ul>
      </article>

      <article className="ai-models-card">
        <h2>Model 3: Gradient Boosting with Time Features</h2>
        <p>
          This is the most complex model using gradient boosting (basically lots of small models working
          together). It also looks at seasonal patterns and groups counties by region to find areas that
          are similar.
        </p>
        <div className="ai-models-metric">
          <span>Test Accuracy</span>
          <strong>89.7%</strong>
        </div>
        <ul>
          <li>Most accurate of the three models</li>
          <li>Good for long-term predictions</li>
          <li>Works well for both cities and rural areas</li>
        </ul>
      </article>
    </section>

    <section className="ai-models-section">
      <h2>How I Tested the Models</h2>
      <div className="ai-models-accordion">
        <details open>
          <summary>Testing approach</summary>
          <p>
            I split the data so that some counties were used for training and others for testing. This way
            I could see how well the models work on data they haven't seen before. I also checked if they
            work equally well for high-risk areas, low-risk areas, and rural places.
          </p>
        </details>
        <details>
          <summary>Dealing with missing data</summary>
          <p>
            Sometimes counties don't have all the data available. When that happens, the model uses default
            values so it can still make a prediction. The dashboard will show a forecast even if some data
            is missing, but it marks those areas so you know the prediction might be less reliable.
          </p>
        </details>
        <details>
          <summary>Making sure it's reliable</summary>
          <p>
            The models use multiple data sources, so if one source has problems the predictions still work.
            Everything is logged so you can see how predictions were made.
          </p>
        </details>
      </div>
    </section>

    <section className="ai-models-section">
      <h2>Code and Results</h2>
      <p>
        All the code for training these models is in <code>current_best_model.py</code>. It has all three
        models so you can see how they work and run them yourself if you want to check the results.
      </p>
      <div className="ai-models-footer-grid">
        <div>
          <h3>What the models predict</h3>
          <ul>
            <li>Energy shortage risk for each county</li>
            <li>How confident the prediction is</li>
            <li>Which areas need attention first</li>
          </ul>
        </div>
        <div>
          <h3>Why this matters</h3>
          <ul>
            <li>Helps plan for reliable energy supply</li>
            <li>Makes energy more affordable</li>
            <li>Keeps important services running during emergencies</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
)

export default AIModelsReport
