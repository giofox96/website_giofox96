---
title: NoiseXcape
subtitle: Can open data help us predict urban noise?
year: 2026
category: computational
featured: true
highlight: true
order: 2
type: Machine learning, urban noise
context: MaCAD, IAAC
location: Barcelona
summary: Street-level noise in Barcelona predicted from OpenStreetMap and space syntax metrics, with accuracy raised from 49% to 70% and models tested in five other European cities.
tags: [XGBoost, SHAP, OpenStreetMap, Space syntax]
team: [Elena Corio, Andrea Cutroni, Giovanni Carlo Volpe, Symon Kipekemi]
course: Data Encoding
faculty: Gabriella Rossi, Georgios Bekakos
link: https://blog.iaac.net/noisexcape-can-open-data-help-us-predict-urban-noise/
cover: ./cover.jpg
coverAlt: Map of Barcelona streets coloured by daytime noise level, from under 40 dB to over 70 dB
workflowTitle: Workflow
workflow:
  - label: Noise data
    text: Barcelona's open noise map for day, evening and night, matched to the OpenStreetMap street network.
    image: ./step-1.jpg
  - label: Urban features
    text: 18 variables per street segment, from space syntax centralities to land use and points of interest within 50 m.
    image: ./step-2.jpg
  - label: Models
    text: Linear regression, XGBoost and random forest, trained separately for day, evening and night.
    image: ./step-3.jpg
  - label: Explainability
    text: Ablation studies and SHAP values show that distances to roads and network centrality carry most of the signal.
    image: ./step-4.jpg
  - label: Transfer
    text: The models deployed on Barcelona and tested in five other European cities.
    image: ./step-5.jpg
gallery:
  - image: ./pipeline.jpg
    alt: Pipeline from noise data, street network, points of interest and land use to model training and deployment
    caption: Pipeline
    diagram: true
  - image: ./street-network.jpg
    alt: Barcelona street network coloured by road category and total width
    caption: Street network features
    diagram: true
  - image: ./pca.jpg
    alt: Explained variance of the principal components
    caption: Principal component analysis
    diagram: true
  - image: ./models.jpg
    alt: Predicted versus actual noise for linear regression, XGBoost and random forest
    caption: Regression models, daytime
    diagram: true
  - image: ./deployment.jpg
    alt: Map of the deployed model predictions
    caption: Deployment
    diagram: true
  - image: ./conclusions.jpg
    alt: Achievements, limitations and next steps
    caption: Conclusions
    diagram: true
---

Noise is one of the most pervasive stressors in cities, yet detailed noise maps are expensive to produce and quickly go out of date. The project asks whether street-level noise can be estimated from openly available spatial data alone.

Barcelona's open noise map provided the target values; OpenStreetMap provided street networks, land use, public transport, traffic signals and points of interest. After matching the two networks and cleaning the data, the dataset held 12,854 street segments, described also through space syntax metrics such as betweenness and closeness centrality.

Tree-based models clearly outperformed linear regression: for daytime noise, random forest reached a test R² of 0.70 and XGBoost 0.67, against 0.44 for linear regression. Removing tunnel segments, acoustic outliers, gave the largest single improvement. Ablation studies showed that distance and network centrality features alone almost match the full feature set.

Adding distance to roads and street centrality raised prediction accuracy in Barcelona from 49% to 70%. Four models were compared, SHAP values showed which features mattered most, and the models were tested in five other European cities, where population density and mobility patterns turned out to shape noise as much as street geometry.
