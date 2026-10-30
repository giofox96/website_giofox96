---
title: Hyperbuilding 02
subtitle: Structure and facade of a twin-tower megastructure
year: 2026
category: computational
order: 10
type: Megastructure, structural systems, data workflows
context: MaCAD, IAAC
summary: The structure and facade team of a twin-tower hyperbuilding. Program data parsed into loads, a topology-optimised megastructure, mega-diagrid, belt trusses and cores scored on three structural KPIs, then published through Speckle Automate so other teams get CSVs and heatmaps without opening Rhino.
tags: [Grasshopper, Python, Ameba, Topology optimisation, Speckle, BIM]
team: [Shuai Zhang, Giovanni Carlo Volpe, Hala Lahlou]
course: BIMSC Studio, Collaborative Workflows
faculty: Cristóbal Ignacio Burgos Sanhueza, Pablo Antuña Molina, Hari Krishnan (Studio); Libny Pacheco, Christoph Berkmiller, Vladimir Ondejcik (Collaborative Workflows)
link: https://blog.iaac.net/structure-facade-team/
cover: ./cover.jpg
coverAlt: Close-up render of the two diagrid towers and the trussed sky bridge between them, with slabs and cores visible through the steel lattice
workflowTitle: Structural workflow
workflow:
  - label: Data parsing
    text: The program team's master dataset, massing and podium translated in Grasshopper and Python into live, self-weight and superimposed loads per slab typology.
    image: ./data-parsing.jpg
  - label: Topology optimisation
    text: Ameba removes material from the design domain to find the load paths of the megastructure.
    image: ./topology-optimisation.jpg
  - label: Cores
    text: 16 × 16 m concrete cores, spaced 40 to 60 m apart for safe egress distances.
    image: ./cores.jpg
  - label: Belt trusses
    text: Belt trusses tie the towers at the sky bridge and the roof, with precast steel joints.
    image: ./belt-truss.jpg
  - label: Diagrid logic
    text: Mega-diagrid with mega-hoops, a cable secondary layer and welded plate joints, subdivided more where curvature is higher.
    image: ./diagrid-logic.jpg
  - label: KPIs
    text: Three massings compared on column-free area ratio, structural efficiency and material usage intensity.
    image: ./kpis.jpg
  - label: Speckle Automate
    text: Every Grasshopper commit triggers a Python function that tags elements, writes CSV schedules and heatmaps, and opens an issue in the model.
    image: ./how-it-works.jpg
  - label: Shared insight
    text: Structural, data and program teams read the results in the browser, without any local software.
    image: ./user-workflow.jpg
videos:
  - src: video/hb02-topology-optimisation.mp4
    poster: video/hb02-topology-optimisation.jpg
    caption: Topology optimisation of the megastructure
    loop: true
  - src: video/hb02-speckle-automate.mp4
    poster: video/hb02-speckle-automate.jpg
    caption: Speckle Automate demo, from a Grasshopper commit to heatmaps and reports in the viewer
gallery:
  - image: ./structural-system.jpg
    alt: Why, how and what of the structural system, from slabs, diagrid and belt trusses to windows, lift cores and the main megastructure
    caption: Structural system
    diagram: true
  - image: ./kpi-definitions.jpg
    alt: Definitions of the three KPIs, column-free area ratio, material usage intensity and structural efficiency rating
    caption: Structural KPIs
    diagram: true
  - image: ./slab-typology.jpg
    alt: Table of four slab typologies with thickness, self-weight, superimposed dead load and live load
    caption: Slab typologies and loads
    diagram: true
    half: true
  - image: ./problem.jpg
    alt: The structural Grasshopper definition, with the data silo, bottleneck and asynchronous friction it caused
    caption: The problem, data trapped in Grasshopper
    diagram: true
    half: true
  - image: ./users.jpg
    alt: Target users, the structural team and the data and program teams
    caption: Target users
    diagram: true
  - image: ./solution.jpg
    alt: Proposed solution, from canvas to cloud, automated deliverables and issue notifications
    caption: Proposed solution
    diagram: true
---

Hyperbuilding 02 is a twin-tower megastructure designed by several teams in the BIMSC studio of the MaCAD master. Our team was responsible for structure and facade: turning the program team's data into loads, finding the structural system and measuring it with shared KPIs.

In the Collaborative Workflows course we made those results available to everyone else. A Speckle Automate function runs on every new model version, so the other teams get structured data instead of a raw 3D model. The Revit side of the same tower is in [Megadiagrid](../megadiagrid/). The collaborative workflow is also on the [IAAC Blog](https://blog.iaac.net/digital-tools-for-collaborative-workflows-structure-facade-hb02/).
