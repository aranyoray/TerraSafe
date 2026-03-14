# Energy deficit prediction models
# Author: Ekaansh Ravuri

import numpy as np
import pandas as pd
import requests
from sklearn.cluster import KMeans
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


class ModelMetrics:
  def __init__(self, r2, mae):
    self.r2 = r2
    self.mae = mae


def load_training_data(path):
  # Load CSV file with training data
  df = pd.read_csv(path)

  # Make all column names lowercase
  df.columns = df.columns.str.lower()

  # Check if we have all the columns we need
  required_columns = [
    "innovation_index",
    "birth_death_ratio",
    "migration",
    "infrastructure_gap",
    "disaster_exposure",
    "energy_deficit",
    "county",
    "state",
  ]

  for col in required_columns:
    if col not in df.columns:
      print(f"Error: Missing column {col}")
      return None

  # Fill missing values with median
  for col in df.columns:
    if df[col].dtype in [np.float64, np.int64]:
      median_val = df[col].median()
      df[col] = df[col].fillna(median_val)

  return df


def train_regression_model(df):
  # Basic linear regression model
  # Get the feature columns
  features = df[["innovation_index", "birth_death_ratio", "migration", "infrastructure_gap", "disaster_exposure"]].copy()

  # Add some squared terms for better fit
  features["birth_death_ratio_sq"] = features["birth_death_ratio"] ** 2
  features["migration_sq"] = features["migration"] ** 2

  # Get what we're trying to predict
  target = df["energy_deficit"].values

  # Split into training and test sets (80/20 split)
  x_train, x_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)

  # Train the model
  model = LinearRegression()
  model.fit(x_train, y_train)

  # Test it
  predictions = model.predict(x_test)
  r2 = r2_score(y_test, predictions)
  mae = mean_absolute_error(y_test, predictions)

  metrics = ModelMetrics(r2, mae)
  return model, metrics


def load_slope_signals(excel_path):
  # Load slope data from excel file
  df = pd.read_excel(excel_path)
  df.columns = df.columns.str.lower()

  if "slope_url" not in df.columns:
    print("Error: Need slope_url column")
    return None

  # Get slope data from URLs
  slope_values = []
  for index, row in df.iterrows():
    try:
      response = requests.get(row["slope_url"], timeout=10)
      if response.status_code == 200:
        data = response.json()
        slope = data.get("mean_slope", 0.0)
        slope_values.append(slope)
      else:
        slope_values.append(0.0)
    except:
      slope_values.append(0.0)

  df["mean_slope"] = slope_values

  # Fill missing slope values with median
  median_slope = df["mean_slope"].median()
  df["mean_slope"] = df["mean_slope"].fillna(median_slope)

  return df[["state", "county", "mean_slope"]]


def train_reinforcement_model(df, slope_df):
  # Model with slope data added
  # Combine main data with slope data
  combined_df = df.merge(slope_df, on=["state", "county"], how="left")

  # Fill missing slopes
  median_slope = combined_df["mean_slope"].median()
  combined_df["mean_slope"] = combined_df["mean_slope"].fillna(median_slope)

  # Get features and target
  feature_cols = ["innovation_index", "birth_death_ratio", "migration", "infrastructure_gap", "disaster_exposure", "mean_slope"]
  features = combined_df[feature_cols].values
  target = combined_df["energy_deficit"].values

  # Normalize the features
  scaler = StandardScaler()
  features_scaled = scaler.fit_transform(features)

  # Initialize weights to zero
  weights = np.zeros(features_scaled.shape[1])

  # Train using gradient descent
  learning_rate = 0.05
  num_iterations = 250

  for i in range(num_iterations):
    # Make predictions
    predictions = np.dot(features_scaled, weights)

    # Calculate error
    errors = predictions - target

    # Update weights
    gradient = np.dot(features_scaled.T, errors) / len(target)
    weights = weights - (learning_rate * gradient)

  # Final predictions
  final_preds = np.dot(features_scaled, weights)

  # Calculate metrics
  r2 = r2_score(target, final_preds)
  mae = mean_absolute_error(target, final_preds)
  metrics = ModelMetrics(r2, mae)

  return weights, metrics


def build_seasonal_features(df, date_column):
  # Add seasonal features from dates
  result = df.copy()
  dates = pd.to_datetime(result[date_column])

  # Get month number
  result["month"] = dates.dt.month

  # Convert to sin/cos for cyclical pattern
  result["sin_month"] = np.sin(2 * np.pi * result["month"] / 12)
  result["cos_month"] = np.cos(2 * np.pi * result["month"] / 12)

  return result


def add_spatial_clusters(df, lat_col="latitude", lon_col="longitude"):
  # Group counties by geographic location
  result = df.copy()

  # Check if we have lat/lon columns
  if lat_col not in result.columns or lon_col not in result.columns:
    result["spatial_cluster"] = 0
    return result

  # Get coordinates and fill missing values
  coords = result[[lat_col, lon_col]].copy()
  for col in [lat_col, lon_col]:
    median_val = coords[col].median()
    coords[col] = coords[col].fillna(median_val)

  # Normalize coordinates
  scaler = StandardScaler()
  coords_scaled = scaler.fit_transform(coords)

  # Create 8 clusters
  kmeans = KMeans(n_clusters=8, random_state=42, n_init=10)
  result["spatial_cluster"] = kmeans.fit_predict(coords_scaled)

  return result


def train_gradient_boosting(df, date_column):
  # Most advanced model with gradient boosting
  # Add seasonal features
  df_with_seasons = build_seasonal_features(df, date_column)

  # Add spatial clusters
  df_complete = add_spatial_clusters(df_with_seasons)

  # Select features to use
  feature_cols = [
    "innovation_index",
    "birth_death_ratio",
    "migration",
    "infrastructure_gap",
    "disaster_exposure",
    "sin_month",
    "cos_month",
    "spatial_cluster",
  ]

  # Get features and target
  X = df_complete[feature_cols]
  y = df_complete["energy_deficit"]

  # Split data
  x_train, x_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

  # Train gradient boosting model
  model = GradientBoostingRegressor(random_state=42)
  model.fit(x_train, y_train)

  # Test predictions
  predictions = model.predict(x_test)

  # Calculate metrics
  r2 = r2_score(y_test, predictions)
  mae = mean_absolute_error(y_test, predictions)
  metrics = ModelMetrics(r2, mae)

  return model, metrics


def run_training_pipeline(training_csv, slope_excel, seasonal_date_column):
  # Main function to train all three models
  print("Loading training data...")
  df = load_training_data(training_csv)

  # Train model 1: basic regression
  print("Training basic regression model...")
  regression_model, regression_metrics = train_regression_model(df)

  # Train model 2: with slope data
  print("Loading slope data...")
  slope_df = load_slope_signals(slope_excel)
  print("Training model with slope signals...")
  weights, reinforcement_metrics = train_reinforcement_model(df, slope_df)

  # Train model 3: gradient boosting
  print("Training gradient boosting model...")
  boosting_model, boosting_metrics = train_gradient_boosting(df, seasonal_date_column)

  # Show regression formula
  print("\nRegression coefficients:")
  print(f"  Innovation index: {regression_model.coef_[0]:.4f}")
  print(f"  Birth/death ratio: {regression_model.coef_[1]:.4f}")
  print(f"  Migration: {regression_model.coef_[2]:.4f}")
  print(f"  Infrastructure gap: {regression_model.coef_[3]:.4f}")
  print(f"  Disaster exposure: {regression_model.coef_[4]:.4f}")
  print(f"  Intercept: {regression_model.intercept_:.4f}")

  results = {
    "regression": regression_metrics,
    "reinforcement_learning": reinforcement_metrics,
    "gradient_boosting": boosting_metrics,
  }

  return results


if __name__ == "__main__":
  print("Starting model training pipeline...\n")

  results = run_training_pipeline(
    training_csv="data/county_energy_training.csv",
    slope_excel="data/county_state_id.xlsx",
    seasonal_date_column="date",
  )

  print("\n=== Results ===")
  for model_name, metrics in results.items():
    print(f"{model_name}: R2 = {metrics.r2:.3f}, MAE = {metrics.mae:.3f}")
