---
title: inHabit
subtitle: Residential layout search with spatial intelligence
year: 2026
category: computational
featured: true
order: 3
type: AI agent, layout search
context: MaCAD, IAAC
summary: A conversational copilot that finds the floor plan that fits the way a household lives, using semantic descriptions, room graphs and an agent that explains its choices.
tags: [LLM agents, Graphs, Embeddings, Grasshopper]
team: [Elena Corio, Marina Osmolovska, Giovanni Carlo Volpe, Andrea Cutroni, Symon Kipekemi]
course: AIA Studio
faculty: João M. Silva, Bao Trinh, Scott Lebow
link: https://blog.iaac.net/inhabit-rethinking-residential-layout-search-with-spatial-intelligence/
cover: ./cover.jpg
coverAlt: The inHabit interface with a conversation panel, a selected floor plan and its scores
workflow:
  - label: Dataset
    text: Over 800 furnished layouts generated with custom Python scripts and PlanFinder.
    image: ./step-1.jpg
  - label: Furniture recognition
    text: Furniture outlines clustered with HDBSCAN into 29 categories and eight architectural features.
    image: ./step-2.jpg
  - label: Semantic descriptions
    text: Room relationships computed as rules, then written in plain language by a vision language model.
    image: ./step-3.jpg
  - label: Layout graphs
    text: Rooms as nodes, doors and shared walls as edges, with area, shape and compactness.
    image: ./step-4.jpg
  - label: Agent workflow
    text: Reason, search, adapt with Grasshopper and RGraphLib, evaluate, and keep the brief across the conversation.
    image: ./step-5.jpg
  - label: Evaluation
    text: Scores, daylight and daily routines for each person in the household.
    image: ./step-6.jpg
gallery:
  - image: ./approach.jpg
    alt: Three phases, understand, explore and evaluate
    caption: Understand, explore, evaluate
    diagram: true
  - image: ./feedback.jpg
    alt: Agent diagram with user prompt, reason node, clarification and household extraction
    caption: Reasoning and feedback
    diagram: true
  - image: ./search.jpg
    alt: Description space and graph space combined to select a layout
    caption: Semantic and graph search
    diagram: true
  - image: ./adaptation.jpg
    alt: Examples of layouts adapted to a new boundary, with deleted and swapped rooms
    caption: Layout adaptation
    diagram: true
  - image: ./benchmark.jpg
    alt: Radar charts comparing Qwen3, Gemini 2.5 Flash and Claude Haiku 4.5
    caption: Language model benchmark
    diagram: true
  - image: ./prompts.jpg
    alt: Three household prompts of increasing detail
    caption: Test prompts
    diagram: true
---

Finding the right home is not only about square metres or the number of bedrooms. The same floor plan can suit one household and fail another: parents with young children, remote workers, retirees or pet owners all live a space differently. Search tools still rely on simple filters that miss this.

inHabit is a spatial intelligence copilot. People describe their household, habits and preferences in natural language; the system turns the brief into structured information, searches a database of residential layouts and returns the best match with an explanation. Each new detail refines the search instead of restarting it.

Every apartment is described twice: as text, generated from geometric rules and a vision language model, and as a graph of rooms and their connections. The search combines both, so it looks for similar ways of living and similar spatial organisations. A stateful agent can adapt the chosen plan to a new boundary, then evaluates it with daylight simulation and daily routines for each member of the household.
