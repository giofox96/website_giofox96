---
title: The Arthropod Pavilion
subtitle: Biomimetic lattice shell
year: 2025
category: computational
featured: true
order: 3
type: Pavilion, structural optimisation
context: MaCAD, IAAC
summary: A lattice shell on discrete legs, inspired by the exoskeleton of the horseshoe crab. Form-finding, stress lines and a body-centred cubic lattice, then optimised down to 83 mm of maximum displacement.
tags: [Kangaroo, Alpaca4d, Lilypad, Crystallon]
team: [Shuai Zhang, Giovanni Carlo Volpe]
course: Structural Optimization
faculty: Aaron Porterfield, Marco Pellegrino, Matea Pinjusic
link: https://blog.iaac.net/the-arthropod-pavillion/
cover: ./cover.jpg
coverAlt: The white lattice pavilion standing on curved legs in a park, people relaxing on the grass around it
workflow:
  - label: Form-finding
    text: From base points to a relaxed mesh with Kangaroo and Alpaca4d.
    image: ./step-1.jpg
  - label: Stress lines
    text: Principal stress lines traced on the mesh with Lilypad.
    image: ./step-2.jpg
  - label: Lattice fill
    text: Body-centred cubic lattice cells filled with Crystallon.
    image: ./step-3.jpg
  - label: Structural analysis
    text: Displacement and utilisation of the deformed model.
    image: ./step-4.jpg
  - label: Optimisation
    text: Shorter cantilevers, extra supports and no outer boundary loop. Maximum displacement down to 83 mm.
    image: ./step-5.jpg
gallery:
  - image: ./park.jpg
    alt: The pavilion in a park at sunset, its legs reaching the ground in a ring
  - image: ./workflow.jpg
    alt: Workflow diagram from primary curves and base mesh to structural analysis and optimisation
    caption: Workflow, first proposal
    diagram: true
  - image: ./stress-lines.jpg
    alt: Four views of the mesh with forces and stress lines in both principal directions
    caption: Forces and Lilypad stress lines
    diagram: true
  - image: ./lattice-data.jpg
    alt: Lattice structure with material, supports, loads and lattice properties
    caption: Structural model settings
    diagram: true
  - image: ./optimisation-before.jpg
    alt: Displacement of the pavilion before and after the design optimisation
    caption: Before and after optimisation
    diagram: true
  - image: ./workflow-revised.jpg
    alt: Revised workflow with fewer cantilevers, more supports and the outer loop removed
    caption: Workflow, second proposal
    diagram: true
  - image: ./garden.jpg
    alt: The pavilion among trees in a garden
  - image: ./florence-1.jpg
    alt: The pavilion in a Florentine square with people around it
    half: true
  - image: ./florence-2.jpg
    alt: The pavilion in front of Palazzo Vecchio in Florence
    half: true
---

Inspired by the exoskeleton of the horseshoe crab and by the ITECH Research Pavilion 2024, the project explores a biomimetic lattice shell supported by discrete legs. A continuous mesh distributes loads across its surface and transfers them to the ground through optimised supports.

The lattice is generated parametrically: form-finding gives the global shape, stress lines guide the structure, and a body-centred cubic lattice fills the shell. Form, structure and material efficiency become one system.

A first analysis led to a critical step back. The cantilevered parts of the roof were shortened, extra pillars gave the loads a more direct path to the ground, and the outer boundary loop, where stress concentrated most, was removed. Maximum displacement dropped to 83 mm, with only 6 overutilised beams out of about 45,500.
