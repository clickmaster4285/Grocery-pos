# Ollama Local LLM Deployment Analysis

## 1. Installation & Environment
*   **Operating System**: The documentation implies a local development environment (confirmed as Windows/win32 via session context).
*   **Core Dependency**: Ollama runtime.
*   **Initialization Commands**:
    *   `ollama serve`: Starts the local API server.
    *   `ollama pull phi3:mini`: Downloads the specialized lightweight model.
*   **Hardware Baseline**:
    *   **CPU**: Intel i5-6400.
    *   **RAM**: 8GB (Strict limitation).
    *   **GPU**: None (Runs entirely on CPU).

## 2. Configuration & Parameters
*   **Model Selection**: `phi3:mini`. Selected specifically for its low memory footprint and ability to generate high-quality structured JSON on CPU-bound hardware.
*   **Endpoint**: `http://localhost:11434/api/generate`.
*   **Request Configuration**:
    *   `stream: false`: Disabled to allow the backend to receive and parse the full JSON response at once.
    *   **System Prompts**: Configured to enforce strict JSON output without conversational filler.

## 3. Model Management
*   **Workflow**:
    *   Models are managed via the Ollama CLI.
    *   Integrated into the Express backend via a dedicated service layer (`/backend/ai/ollama.service.js`).
    *   The model acts as an **Intent Router** rather than a general-purpose chatbot.

## 4. API Access & Integration
*   **Internal Routing**: The backend exposes a wrapper endpoint `POST /ai/chat` via `ai.routes.js`.
*   **Data Payload**:
    ```json
    {
      "model": "phi3:mini",
      "prompt": "[User Query]",
      "stream": false
    }
    ```
*   **Service Layer**: Handles communication between the Express app and the local Ollama API, abstracting the raw HTTP calls.

## 5. Security & Data Integrity
*   **Access Control**: AI has **ZERO** direct access to MongoDB. All data retrieval is handled by validated backend services.
*   **Context Injection**: The backend forcibly injects `branchId` and `userRole` into the service logic *after* the AI detects intent. The AI cannot "choose" to see another branch's data.
*   **Permission Shield**: Existing RBAC (Role-Based Access Control) remains the final gatekeeper for all actions suggested by the AI.

## 6. Performance Optimization
*   **Resource Management**: Using `phi3:mini` avoids system crashes on 8GB RAM machines.
*   **Data Minimization**: Never sends raw datasets to the LLM. Only pre-filtered, aggregated, or paginated data is provided for summarization.
*   **Production Scaling**: Deployment plan moves AI to a dedicated server (16–32GB RAM) to avoid impacting POS terminal performance.

## 7. Strategic Use Cases
*   **Intent Routing**: Converting natural language into structured commands (e.g., `{ "tool": "inventory", "action": "LOW_STOCK" }`).
*   **Domain-Specific Tools**:
    *   **Inventory**: Low stock alerts and threshold management.
    *   **Sales**: Trend analysis and performance summaries.
    *   **HR**: Shift and employee performance insights.
*   **Executive Assistant**: Providing a high-level command interface for administrators to query complex analytics without manually navigating every report.
