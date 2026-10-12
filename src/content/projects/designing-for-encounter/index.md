---
title: Designing for Encounter
subtitle: How spatial analysis reveals the social potential of circulation spaces
year: 2026
category: computational
order: 1
type: Spatial analysis, graphs
context: MaCAD, IAAC
location: Vienna and Berlin
summary: Three cohousing buildings read through room graphs, space syntax, shortest paths and isovists, to find where circulation can become a place to meet.
tags: [Python, Space syntax, Isovists, Graph ML]
team: [Elena Corio, Andrea Cutroni, Giovanni Carlo Volpe, Symon Kipekemi]
course: Graph Machine Learning
faculty: Wassim Jabi, Olga Poletkina
link: https://blog.iaac.net/designing-for-encounter-how-spatial-analysis-reveals-the-social-potential-of-circulation-spaces/
cover: ./cover.jpg
coverAlt: Closeness, betweenness and degree centrality maps of the Wohnprojekt Wien floors
gallery:
  - image: ./floorplans.jpg
    alt: Ground and typical floor plans of Wohnprojekt Wien with room functions
    caption: Wohnprojekt Wien, floor plans
    diagram: true
  - image: ./topology.jpg
    alt: Topological graph of the typical floor, rooms as nodes and doors and thresholds as links
    caption: Wohnprojekt Wien, topology
    diagram: true
  - image: ./visibility-wien.jpg
    alt: Shortest paths, isovists and visibility on the Wohnprojekt Wien floors
    caption: Wohnprojekt Wien, visibility and movement
    diagram: true
  - image: ./syntax-gleis21.jpg
    alt: Closeness, betweenness and degree centrality on the Gleis21 floors
    caption: Gleis21, space syntax
    diagram: true
  - image: ./visibility-gleis21.jpg
    alt: Shortest paths, isovists and visibility on the Gleis21 floors
    caption: Gleis21, visibility and movement
    diagram: true
  - image: ./topology-spreefeld.jpg
    alt: Topological graph of a Spreefeld floor
    caption: Spreefeld, topology
    diagram: true
  - image: ./syntax-spreefeld.jpg
    alt: Closeness, betweenness and degree centrality on the Spreefeld floors
    caption: Spreefeld, space syntax
    diagram: true
  - image: ./visibility-spreefeld.jpg
    alt: Shortest paths, isovists and visibility on the Spreefeld floors
    caption: Spreefeld, visibility and movement
    diagram: true
  - image: ./gnn-prediction.jpg
    alt: Node label prediction on a single apartment graph, misclassified nodes ringed in red, with 3 of 10 predictions correct
    caption: Appendix, node label prediction
    diagram: true
    half: true
  - image: ./gnn-scoring.jpg
    alt: Predicted labels, scoring and ground truth for the apartment graph
    caption: Appendix, prediction against ground truth
    diagram: true
    half: true
---

Corridors in apartment buildings are usually designed for movement, not for meeting: long, narrow and socially inert. Cohousing projects show that simple moves, such as widening a corridor, opening a view or adding a place to pause, can turn circulation into a social catalyst. These decisions are usually intuitive rather than analytical. The project asks whether spatial analysis can systematically identify opportunities for encounter and inform targeted design interventions.

Three cohousing buildings were studied: Wohnprojekt Wien and Gleis21 in Vienna, and Spreefeld in Berlin. Each was read through its floor plans, a topological graph of rooms and connections, space syntax centralities (closeness, betweenness and degree), shortest paths and isovists.

Across the three buildings, high visibility and strong spatial connectivity are the conditions that enable encounter, and the single-loaded corridor shows the greatest social potential. An appendix tested node label prediction with a model pretrained on Swiss dwellings; it labelled every room as a bedroom, showing how such models struggle with less standard, socially oriented housing.
