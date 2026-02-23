# Supermarket POS – Local AI Integration Plan (Ollama)

## Project Overview

We are building a **commercial multi-branch Supermarket POS system** using:

- Next.js (Frontend)
- Node.js / Express (Backend)
- MongoDB (Database)
- Role-based access control
- Multi-branch support (1–50 branches)
- 1,000 to 50,000+ products (SKUs)
- Inventory, HR, Sales, Analytics, Vendors, Terminals, etc.

This is NOT a demo project. It is designed to scale commercially.

---

# Why We Are Using Ollama

We want to integrate a **local AI assistant** into the POS system.

Goals of AI:

- Understand user questions
- Detect intent
- Route to correct business logic
- Help with analytics
- Assist admin users
- Generate summaries
- Never directly access the database

We are NOT training a custom AI model.
We are using a local LLM via Ollama.

Reason:
- Faster development
- No cloud dependency
- Data privacy
- Full backend control
- Lower cost

---

# Hardware Constraints

Current Development Machine:

- Intel i5-6400
- 8GB RAM
- No dedicated GPU

Because of this, we selected:

Model: `phi3:mini`

Reason:
- Lightweight
- Runs on CPU
- Good for structured output
- Good for intent detection
- Low memory usage

We are NOT using 8B or 70B models due to RAM limits.

---

# What We Have Done So Far

## 1. Installed Ollama

Verified with:


ollama serve


Server running at:


http://localhost:11434


---

## 2. Pulled Model


ollama pull phi3:mini


---

## 3. Verified API

Using:

POST http://localhost:11434/api/generate

Body:

```json
{
  "model": "phi3:mini",
  "prompt": "hi there",
  "stream": false
}

Response successful.

4. Connected Ollama to Express Backend

Created:

/ai/ollama.service.js

Handles:

Sending prompt

Returning response

Created:

/routes/ai.routes.js

Endpoint:

POST /ai/chat

Confirmed working.

Important Architectural Decision

AI WILL NOT:

Directly access MongoDB

Execute business logic

Modify stock

Bypass permissions

Replace services

AI WILL:

Detect user intent

Return structured JSON

Select domain tools

Provide summaries

Current Goal

Convert AI from:

Chatbot

Into:

Intent Router

Tool-Based Architecture

Instead of creating dozens of small AI functions,
we create domain-level tools.

Example domains:

inventory

sales

hr

analytics

system

AI returns structured JSON like:

{
  "tool": "inventory",
  "action": "LOW_STOCK",
  "threshold": 10
}

Backend then:

Validates user permissions

Calls appropriate service

Queries MongoDB

Returns result

Optionally sends summary back to AI

Current Implementation Stage

We are implementing:

AI Intent Detection with Strict JSON Output

System Prompt Forces:

Only valid JSON

No explanations

No extra text

This converts AI into a router.

Complete System Flow

User → Frontend → Express → AI Router → Service Layer → MongoDB

AI decides:

What user wants

Backend decides:

What user is allowed to access

Security Design

We inject:

branchId from authenticated user

role from middleware

AI is NEVER allowed to choose branchId freely.

Permission system remains intact.

Database Design for Scalability

We support up to 50,000 SKUs.

Key decisions:

Products stored globally

Inventory stored per branch

No product duplication per branch

Indexed fields:

barcode

sku

product name

branchId

categoryId

Stock stored in separate collection:

inventory:

productId

branchId

quantity

batch info (for FIFO)

Performance Strategy

Pagination required

Indexed queries only

Aggregation pipelines for analytics

AI receives filtered results only

Never send large datasets to model

Phased Development Plan
Phase 1 – Intent Router (Current)

AI detects tool

Returns JSON

Backend parses JSON

Basic routing works

Phase 2 – Domain Tool Implementation

Implement:

inventoryTool()
salesTool()
hrTool()

Each tool:

Calls service layer

Uses existing business logic

Maintains permission checks

Phase 3 – Analytics AI

Sales trends

Branch comparison

Low stock alerts

Performance summaries

Phase 4 – Advanced Features

Forecasting

Demand prediction

Reorder suggestions

Vendor performance insights

Production Plan (Future)

Development:
AI runs locally via Ollama.

Production:

AI service runs on separate server (16–32GB RAM)

POS terminals call central AI API

Never run AI on cashier machines

Design Philosophy

AI is:

Assistant layer

NOT:

Core logic layer

All business logic stays in services.

AI only:

Understands language

Converts to structured command

Long-Term Vision

The system should support:

50 branches

50,000 SKUs

100+ terminals

High transaction volume

Real-time analytics

AI becomes:

Executive Assistant for Admin Dashboard

Not a chatbot.

Immediate Next Steps

Finalize strict JSON prompt format.

Implement inventoryTool.

Connect tool to real MongoDB queries.

Add safe JSON parsing with fallback.

Add logging for AI actions.

Add error handling for invalid AI output.

Final Objective

Build a secure, scalable, tool-driven AI layer inside a commercial supermarket POS system using Ollama locally during development, and migrate to a dedicated AI server in production.

AI will enhance:

Analytics

Reporting

Operational awareness

Decision-making

Without compromising:

Security

Performance

Data integrity

Permission structure