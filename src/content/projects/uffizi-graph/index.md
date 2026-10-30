---
title: Uffizi as a Graph
subtitle: Reading the gallery's first and second floors through spatial graphs
year: 2026
category: computational
order: 3
type: Spatial analysis, graphs
context: MaCAD, IAAC
location: Uffizi Gallery, Florence
coords: [43.768, 11.255]
city: Florence
summary: The Uffizi's two gallery floors sliced into a grid graph, read through closeness, betweenness, community detection and degree centrality, with shortest paths between the masterpieces a visitor comes for.
tags: [Python, TopologicPy, Space syntax, Graph ML, Community detection]
course: Graph Machine Learning
faculty: Wassim Jabi, Olga Poletkina
link: https://github.com/giofox96/Graph_ML-Giovanni_Carlo_Volpe/tree/main/Assignment_02_Giovanni-Carlo-Volpe
linkLabel: Notebooks and report on GitHub
cover: ./cover.jpg
coverAlt: Closeness and degree centrality maps of the Uffizi first and second floors, warm colours along the long corridors
workflowTitle: Workflow
workflow:
  - label: Plan to grid
    text: Each floor plan is brought from Rhino into TopologicPy and sliced by a regular grid into a shell of small cells.
    image: ./step-1.jpg
  - label: Communities
    text: Louvain community detection on the cell graph finds dense clusters that read as rooms and functional zones.
    image: ./step-2.jpg
  - label: Room graph
    text: The communities are merged into a new shell, and a room-to-room graph is extracted from it.
    image: ./step-3.jpg
  - label: Degree centrality
    text: Room degree is interpolated back onto the cells, separating busy hubs from secluded rooms.
    image: ./step-4.jpg
gallery:
  - image: ./closeness.jpg
    alt: Closeness centrality on the first and second floors, highest along the corridors and the short connecting gallery
    caption: Closeness centrality, first and second floor
    diagram: true
    half: true
  - image: ./betweenness.jpg
    alt: Betweenness centrality on the first and second floors, a bright line along the corridors where most routes pass
    caption: Betweenness centrality, square-root colour scale
    diagram: true
    half: true
  - image: ./shortest-path.jpg
    alt: Shortest routes between artworks on both floors, the raw grid path in red and the straightened walking path in blue
    caption: Shortest path between points of interest, raw (red) and straightened (blue)
    diagram: true
---

The Uffizi is a U-shaped administrative building turned into a sequence of enfilade rooms hung off two long corridors. Its first and second floors hold the core of the collection, from Botticelli to Leonardo, Michelangelo and Raphael. The study translates those floors into spatial graphs to measure, rather than guess, how the rooms are connected, reached and walked through.

Each floor was sliced into a grid and turned into a navigation graph. Closeness centrality finds the spaces that are easiest to reach from everywhere else; betweenness shows the corridors where almost every route converges, the likely congestion points. Community detection then recovers rooms and zones from the unified grid, and a second, room-level graph gives degree centrality, separating gathering hubs from quiet fringes.

Finally, a visitor with a short list of works, such as *The Birth of Venus* or the *Annunciation*, was simulated with points of interest and the shortest route between them. The raw path snaps to grid centres, so it was straightened into a realistic walking line that still respects the walls. The same routes tell curators where crowds will build up and where signage and staff matter most.
