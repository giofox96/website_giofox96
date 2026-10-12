---
title: The Likable Public
subtitle: Civic interiors in the economy of likes
year: 2026
category: computational
order: 2
type: Generative AI, digital essay
context: MaCAD, IAAC
summary: A digital essay and tool that turns civic interiors into "Instagrammable" spaces with a custom Flux LoRA, then estimates how many likes they would get.
tags: [ComfyUI, Flux LoRA, LM Studio, Python]
team: [Giovanni Carlo Volpe, Marina Osmolovska, Eva Vasileska]
course: Generative AI
faculty: James McBennett, Aymeric Brouez
link: https://blog.iaac.net/the-likable-public/
cover: ./cover.jpg
coverAlt: The essay interface with a generated pharmacy interior and its predicted likes
workflowTitle: Workflow
workflow:
  - label: Dataset and LoRA
    text: Café interiors scraped from Instagram and Pinterest train a custom LoRA on Flux 2 Klein.
    image: ./step-1.jpg
  - label: Text to text
    text: ComfyUI, Griptape and LM Studio turn a building input into prompts across six architectural styles.
    image: ./step-2.jpg
  - label: Image generation
    text: Image-to-image and text-to-image with the LoRA, whose strength works as a "likes dial".
    image: ./step-3.jpg
  - label: Likes Calculator
    text: An aesthetic score from 16 composition metrics and a popularity score from a network trained on 2.5 million Instagram image pairs.
    image: ./step-4.jpg
  - label: Interface
    text: An interactive journal with the essay, the original interiors and the generated ones.
    image: ./step-5.jpg
gallery:
  - image: ./question.jpg
    alt: The essay's question, whether public interiors are now designed for image consumption
    caption: The question
    diagram: true
---

The project is a digital essay on interiors designed for image consumption rather than use, and on what happens to public space when it is reshaped by the "economy of likes". Drawing on Guy Debord's Society of the Spectacle, it looks at civic interiors such as clinics, libraries and waiting rooms that become a face for a camera that is not there: spaces "looked at" more than "lived in".

To test the idea, the team trained a custom LoRA on Flux 2 Klein, using café interiors scraped from Instagram and Pinterest, and built a ComfyUI workflow where any civic interior can be dropped in and turned into an "Instagrammable" space.

A final evaluator, the Likes Calculator, combines an aesthetic score and a popularity score into a single visual score, then simulates a like count with a deliberate random factor, since engagement also depends on followers, timing and chance. In one test, applying a pop graphic style to an intake desk at high LoRA strength made the computers disappear: function sacrificed for likability.
