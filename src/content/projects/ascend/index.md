---
title: Ascend
subtitle: Parametric staircase design from web to CAD
year: 2026
category: computational
featured: true
order: 6
type: Web app, Rhino Compute
context: MaCAD, IAAC
summary: An interactive 3D web app for designing staircases. Sliders drive a Grasshopper definition through Rhino Compute, and the result exports as a layered .3dm file ready for CAD.
tags: [Rhino Compute, Grasshopper, Web]
team: [Giovanni Carlo Volpe]
course: Cloud-based Data Management
faculty: Justyna Szychowska, Chuck Driesler, Sophie Moore
link: https://blog.iaac.net/ascend-democratizing-parametric-staircase-design-from-web-to-cad/
cover: ./cover.jpg
coverAlt: The Ascend web app showing a spiral staircase with its parameter panel
workflowTitle: How it works
workflow:
  - label: Typology and orientation
    text: Linear, U-shape or spiral, mirrored on the XZ or YZ plane with the Flip tool.
  - label: Spatial context
    text: A contextual wall shows the room's boundaries and real proportions.
  - label: Parametric controls
    text: Rise, width, step and stringer thickness, balusters, handrails and spiral column radius.
  - label: Rhino Compute
    text: Every change recomputes the Grasshopper definition and sends the mesh back to the browser.
  - label: Export to CAD
    text: A layered .3dm file, dimensionally accurate and ready for the BIM or CAD workflow.
gallery:
  - image: ./u-shape.jpg
    alt: A U-shaped staircase with timber steps in the Ascend interface
    half: true
  - image: ./controls.jpg
    alt: Parameter sliders for rise, width, thickness, handrails and balusters next to a linear staircase
    half: true
---

Designing a staircase means balancing ergonomics, safety rules and form, and it usually happens inside complex CAD software, with the architect involved in every small change. Ascend brings that computational design into the web browser.

The app lets clients, interior designers and architects work together in real time on an accurate 3D model. Through sliders and menus, the mathematics of staircase design becomes a set of direct visual commands. Every interaction queries a Rhino Compute backend that recalculates the Grasshopper definition, so each configuration is physically plausible and safely proportioned, not just a picture.

A material library combines structures and finishes, from concrete and plaster to wood, zinc and glass. When the design is ready, Export downloads a clean, layered .3dm file that goes straight into the architect's CAD or BIM workflow.
