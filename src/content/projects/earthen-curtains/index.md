---
title: Earthen Curtains
subtitle: An adaptive earthen vault for the Bab al-Luq market
year: 2025
category: computational
featured: true
order: 4
type: Market roof, 3D-printed earth
context: MaCAD, IAAC
location: Bab al-Luq market, Cairo
summary: Nubian vaults reinterpreted as a 3D-printed earth roof. Each module is scaled by the solar radiation it receives, so the vault tightens where the sun is strongest and opens where it is mild.
tags: [3D printing, Raw earth, Solar analysis, Kangaroo]
team: [Giovanni Carlo Volpe]
course: Complex Forming
faculty: Hesham Shawqy, Angeliki Maragakis
link: https://blog.iaac.net/earthen-curtains/
cover: ./cover.jpg
coverAlt: Inside the market, light filtered by pink fabric curtains under the earthen roof, stalls and visitors below
workflow:
  - label: Solar response
    text: The roof module follows f(x) = a·x·sin(x), shaped to block the high summer sun and let in the low winter sun.
    image: ./step-1.jpg
  - label: Interlocking vault
    text: Truncated-tetrahedron tassels, scaled by the average incident radiation on each vault section.
    image: ./step-2.jpg
  - label: Supporting structure
    text: A new steel frame of I-beams and hollow sections carries the vault modules.
    image: ./step-3.jpg
  - label: Filtering curtains
    text: Fabric curtains under the grid turn direct sun into diffuse, coloured light.
    image: ./step-4.jpg
  - label: Market layout
    text: The lowest points of the curtains, projected to the ground, place the stalls through circles and metaballs.
    image: ./step-5.jpg
gallery:
  - image: ./concept.jpg
    alt: Concept and pseudocode, from sunlight direction to roof modules, tassels and supporting structure
    caption: Concept and pseudocode
    diagram: true
  - image: ./market-1.jpg
    alt: Market stalls with spices and visitors under the pink curtains
    caption: AI-enhanced render
  - image: ./first-floor.jpg
    alt: Axonometric of the first floor with the curved walkway among the stalls
    caption: First floor
    diagram: true
  - image: ./long-section.jpg
    alt: Longitudinal section of the market hall with the vaulted roof
    caption: Longitudinal section
    diagram: true
  - image: ./cross-section.jpg
    alt: Cross section of the market hall
    caption: Cross section
    diagram: true
  - image: ./market-2.jpg
    alt: Visitors walking under the curtains along the market street
    caption: AI-enhanced render
  - image: ./market-3.jpg
    alt: The curved first-floor walkway above the market
    caption: AI-enhanced render
    half: true
  - image: ./market-4.jpg
    alt: A market lane with stalls and hanging curtains
    caption: AI-enhanced render
    half: true
  - image: ./aerial.jpg
    alt: Aerial view of the market roof among the city blocks
    caption: AI-enhanced render
---

Earthen Curtains starts from vernacular architecture and passive sustainability, and in particular from Hassan Fathy and the tradition of Nubian vaults: local raw earth and built-in climatic strategies, carried into a parametric geometric and constructive system.

The roof form comes from a mathematical function, f(x) = a·x·sin(x), chosen for its potential for solar modulation. Its curvature filters direct radiation in the hottest summer hours, when the sun is high, and lets the lower sun of autumn and winter warm the space.

The vault is discretised into 3D-printed earth "tassels", truncated tetrahedra scaled along their length. The scale is not fixed: it follows the average incident radiation on each vault section. Smaller tassels tighten the mesh and shade the most exposed areas; larger ones open it and let in more light. Fabric curtains below diffuse the light and colour the space, and the market layout is derived from the same geometry.
