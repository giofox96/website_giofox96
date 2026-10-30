---
title: Megadiagrid
subtitle: From parametric structure to BIM
year: 2026
category: computational
order: 9
type: Structural system, Grasshopper to Revit workflow
context: MaCAD, IAAC
summary: A twin-tower megadiagrid generated in Grasshopper, scored on column-free area, structural efficiency and material use, then carried into Revit as adaptive node and pipe families with schedules, sections and data-driven views.
tags: [Grasshopper, Karamba, Rhino.Inside.Revit, Revit, Adaptive families, BIM]
team: [Shuai Zhang, Giovanni Carlo Volpe]
course: Integrative Modeling
faculty: Óscar Herrero, Arnau Pros, Marina Melguizo
link: https://blog.iaac.net/integrating-parametric-design-and-bim-a-workflow-for-megadiagrid-structural-systems/
cover: ./cover.jpg
coverAlt: Two Revit axonometrics of the twin-tower megadiagrid, the second with its diagrid members coloured by radius from blue at the top to red at the base
workflow:
  - label: Parametric megadiagrid
    text: The diagrid is the primary structural frame, generated in Grasshopper. Two iterations compared on column-free area ratio (97% to 98.9%), structural efficiency and material use (1091 down to 863 kg/m²).
    image: ./step-1.jpg
  - label: Grasshopper to Revit
    text: Rhino and Grasshopper geometry pushed into Revit through Rhino.Inside.Revit, keeping the parametric model as the single source.
    image: ./step-2.jpg
  - label: Adaptive nodes
    text: Spherical node families with 3, 4 and 6 adaptive points, 344 placed automatically at the diagrid intersections.
    image: ./step-3.jpg
  - label: Spline pipes
    text: Belt trusses and diagrid members as adaptive pipe and spline beam families, 1022 elements in total.
    image: ./step-4.jpg
  - label: Documentation
    text: Sections and schedules of floors, members and nodes come straight out of the model.
    image: ./step-5.jpg
  - label: Data filters
    text: View filters colour every member by its radius, from 400 mm at the top to 1500 mm at the base.
    image: ./step-6.jpg
gallery:
  - image: ./context.jpg
    alt: Project context slide with the two megadiagrid iterations in red and their three KPIs
    caption: Two iterations and their KPIs
    diagram: true
---

A megadiagrid tower developed for the Integrative Modeling course of the MaCAD master. The structure is designed parametrically in Grasshopper, where the geometry carries the structural logic, and then rebuilt in Revit as a fully scheduled BIM model through Rhino.Inside.Revit and custom adaptive families.
