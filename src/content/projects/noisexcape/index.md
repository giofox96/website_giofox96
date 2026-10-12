---
title: NoiseXcape
subtitle: Can open data help us predict urban noise?
year: 2026
category: computational
order: 3
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
coverAlt: Maps of Barcelona coloured by global and local closeness centrality
gallery:
  - image: ./pipeline.jpg
    alt: Pipeline from noise data, street network, points of interest and land use to model training and deployment
    caption: Pipeline
    diagram: true
  - image: ./street-network.jpg
    alt: Barcelona street network coloured by road category and total width
    caption: Street network features
    diagram: true
  - image: ./models.jpg
    alt: Predicted versus actual noise for linear regression, XGBoost and random forest
    caption: Regression models
    diagram: true
  - image: ./deployment.jpg
    alt: Map of the deployed model predictions
    caption: Deployment
    diagram: true
  - image: ./transfer.jpg
    alt: Model accuracy transferred to other European cities
    caption: Transfer to other cities
    diagram: true
  - image: ./conclusions.jpg
    alt: Achievements, limitations and next steps
    caption: Conclusions
    diagram: true
---

Noise is one of the most pervasive stressors in cities, yet detailed noise maps are expensive to produce and quickly go out of date. The project asks whether street-level noise can be estimated from openly available spatial data alone.

Barcelona's open noise map provided the target values; OpenStreetMap provided street networks, land use, public transport, traffic signals and points of interest. After matching the two networks and cleaning the data, the dataset held 12,854 street segments, described also through space syntax metrics such as betweenness and closeness centrality.

Adding distance to roads and street centrality raised classification accuracy in Barcelona from 49% to 70%. Four models were compared, SHAP values showed which features mattered most, and the models were tested in five other European cities, where population density and mobility patterns turned out to shape noise as much as street geometry.
