---
title: From Point Clouds to BIM
subtitle: A conversation with Václav Nežerka
year: 2026
category: other
order: 1
type: Podcast, interview
context: MaCAD, IAAC
summary: An IAAC MaCAD podcast episode on automated scan-to-BIM with Václav Nežerka (Czech Technical University in Prague), on Cloud2BIM, AI segmentation of point clouds and as-built models for digital twins.
tags: [Scan-to-BIM, Point clouds, Deep learning, IFC, BIM]
team: [Giovanni Carlo Volpe, David Agudelo]
course: BIMSC Theory
faculty: Maite Bravo, Hande Karataş
link: https://open.spotify.com/episode/5VR6qNfleX0qfBCXKlnawa
linkLabel: Listen on Spotify
cover: ./cover.jpg
coverAlt: Podcast cover split between a blue point cloud scan of a corridor and a magenta IFC model of the same space, titled From point clouds to BIM, AI-driven automation
gallery:
  - image: ./segmentation.jpg
    alt: Illustration of a building model with a neural network overlaid, labelled semantic segmentation, deep learning pipeline and automated classification
    caption: Semantic segmentation
    half: true
---

With David Agudelo I interviewed Václav Nežerka, researcher at the Faculty of Civil Engineering of the Czech Technical University in Prague, about automating scan-to-BIM.

Raw point clouds are hard to use for engineering work until they become structured models. Nežerka walks through Cloud2BIM, a pipeline that takes an uploaded scan and returns an IFC file or a native Revit model. It evens out scan density, finds floor slabs with a model trained on synthetic houses, then traces walls, segments elements and detects openings floor by floor. Moving from RANSAC to AI-based segmentation made it far more tolerant of clutter and noise.

Hidden elements such as foundations or MEP still escape full automation, so the realistic target is around LOD 200 to 300. We closed on how accurate as-built models can feed digital twins linked to live sensor data.

Read the full conversation on the [IAAC Blog](https://blog.iaac.net/automated-scan-to-bim-workflows-through-artificial-intelligence-a-conversation-with-vaclav-nezerka/).
