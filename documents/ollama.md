# Supermarket POS: Enterprise AI Architecture & Integration Specification (Ollama Layer)

## 1. System & AI Specifications

### 1.1 Hardware Baseline & Runtime Constraints
To ensure operational stability in a resource-constrained production environment (8GB RAM), the AI layer follows strict allocation limits:
*   **Host CPU**: Intel i5-6400 (Quad-core) | Inference Priority: Background (Low niceness).
*   **Thread Fencing**: restricted to `num_thread: 3` to reserve 25% CPU overhead for core POS transaction processing.
*   **Memory Footprint**: Target < 2.5GB RSS (Resident Set Size). Implementation of `mmap` for efficient model loading.
*   **Inference Engine**: Ollama v0.1.x+ (RESTful API interface over loopback).
*   **Latency Budget**: Target < 2500ms for Intent Detection; < 5000ms for Data Summarization.

### 1.2 Model Determinism & Inference Tuning
*   **Model**: `phi3:mini` (3.8B Parameters, 4-bit Quantized).
*   **Temperature**: `0.0` (Strictly enforced to ensure deterministic, reproducible JSON output).
*   **Context Window (num_ctx)**: `4096 tokens` (Optimized for short-query routing and high-density data summary).
*   **Predict Limit (num_predict)**: `128 tokens` for routing; `512 tokens` for summarization.
*   **Top_P / Top_K**: Disabled to eliminate non-deterministic sampling.
*   **Response Mode**: `format: "json"` (Constrained decoding to guarantee schema compliance).

### 1.3 Token & Memory Governance Policy
To prevent resource exhaustion and ensure consistent performance:
*   **Max Prompt Size**: Input prompts strictly truncated at 1,500 characters (~375 tokens).
*   **Token Budget**:
    *   **Intent Phase**: Max 500 tokens (System Prompt + User Input).
    *   **Summary Phase**: Max 2048 tokens (Data Context).
*   **History Trimming**: "Sliding Window" algorithm retains only the last 3 turns of conversation to minimize context bloat.
*   **Summarization Threshold**: If query results exceed 50 rows, the Service Layer performs a statistical aggregation (count, averages) before passing data to the LLM.
*   **Data Chunking**: Large datasets are chunked into 1KB segments if detailed analysis is required (Phase 3+).
*   **Memory Watchdog**: A background process monitors RSS; if usage > 3.5GB, the Ollama process is gracefully restarted.

---

## 2. Strategic Objectives & ROI

The AI layer is a **Cognitive Middleware** designed to maximize manager productivity:
1.  **Natural Language Query (NLQ)**: Converts conversational English into structured database operations, reducing training time for branch managers.
2.  **Stateless Privacy Compliance**: No PII (Personally Identifiable Information) ever leaves the local network, ensuring 100% data sovereignty.
3.  **Cross-Domain Intelligence**: Synthesizes data across Inventory, Sales, and HR modules that are traditionally siloed.
4.  **Operational Resilience**: Provides mission-critical insights even during ISP outages by running entirely on local hardware.

---

## 3. The "Intent Router" & Middleware Architecture

The integration follows a **Deterministic Dispatcher Pattern**, ensuring the AI only influences query parameters, never the underlying code execution.

### 3.1 Data Flow Pipeline
1.  **Sanitization Layer**: Express.js middleware strips input of script tags and injection attempts.
2.  **Context Rehydration**: Backend injects `req.user.branch`, `req.user.role`, and current `system_time` into the internal request context.
3.  **Inference**: Ollama processes the prompt against the **Master System Manifest** (Few-shot prompting).
4.  **The Parser**: A robust "Clean-and-Parse" utility extracts valid JSON from the LLM buffer, handling potential markdown artifacts.
5.  **Permission Shield**: The existing RBAC (Role-Based Access Control) validates the AI's requested `tool:action` against the user's actual permissions.
6.  **Service Execution**: Validated intent is passed to the standard MERN service layer.

---

## 4. Phased Engineering Roadmap

### Phase 1: Foundation (COMPLETED)
*   [x] Local LLM deployment via Ollama.
*   [x] RESTful abstraction layer in Node.js.
*   [x] JSON-only system prompt engineering.

### Phase 2: Secure Router & Dispatcher (COMPLETED)
*   [x] Implementation of safe JSON extraction with automatic error correction.
*   [x] Few-Shot Library integration for 99% intent accuracy.
*   [x] Domain Mapping: Connected AI to `InventoryService`, `BranchService`, and `SaleService`.
*   [x] Dynamic Injection: Enforced branch isolation at the service level.

### Phase 3: Analytics Synthesis & Natural Language Generation (COMPLETED)
*   [x] **The Narrator Layer**: AI now explains raw JSON data in human-friendly sentences via `summarizeData`.
*   [x] **Smart Clarification**: Implemented fuzzy intent detection for misspelled queries (e.g., "brcnhse").
*   [x] **System Tool**: Global queries (like branch counts) are now supported via `system.tool.js`.

### Phase 4: Full-Domain Coverage & Cross-Branch Authority (COMPLETED)
*   [x] **7-Tool Registry**: Expanded AI coverage to Sales, Inventory, HR, System, CRM, Finance, and Logistics.
*   [x] **Admin Overrides**: Implemented `branchId` extraction for admin-level cross-branch comparisons.
*   [x] **Profit/Loss Logic**: Backend-driven margin analysis (Selling - Buying).

### Phase 5: Personalized Intelligence & Anomaly Detection (CURRENT)
*   **Identity Awareness**: AI now recognizes the user by `firstName` and `role`.
*   **Action: WHO_AM_I**: Direct identity confirmation for the user.
*   **Anomaly Detection**: Flagging transactions that deviate from branch averages.

---

## 5. Engineering Guardrails: Security & Stability

### 5.1 Validation Protocols (The "Don'ts")
*   **❌ No Raw Access**: AI is strictly prohibited from receiving MongoDB connection strings or raw DB handles.
*   **❌ No Mutative Power**: Intent detection is limited to `READ` and `ANALYZE` actions. Any `CREATE/UPDATE/DELETE` intent must be rejected at the Dispatcher level.
*   **❌ No Token Overflow**: Input queries are truncated at 1,500 characters to prevent Prompt Injection and Denial of Service (DoS).
*   **❌ No Unauthorized Branch Hopping**: Multi-tenancy is enforced at the service level; non-admin users are hard-locked to their `req.user.branch`.

### 5.2 Prompt Injection Defense Manifest
The AI Dispatcher implements a strict filtering layer to neutralize adversarial inputs.
*   **Ignored Directives**: The model is trained via system prompt to ignore user instructions attempting to:
    *   Override system rules (e.g., "Ignore previous instructions").
    *   Request raw database access or schema dumps.
    *   Escalate role privileges (e.g., "Act as Admin").
    *   Bypass branch isolation filters.
    *   Reveal the hidden system prompt.
*   **Input Filtering**: Regex pre-processing strips common injection vectors (e.g., repeating characters > 10x, known jailbreak phrases).
*   **Prefix Hardening**: The System Prompt is injected as a "User" message in the chat history immediately preceding the actual user input to reinforce constraints.
*   **Internal Manifest**: The list of available tools is injected dynamically based on the user's role, preventing the AI from even knowing about admin tools when interacting with a standard user.

### 5.3 Failure Modes & Fallbacks
*   **Retry Policy**: Implement an exponential backoff strategy (Max 3 retries: 500ms, 1500ms, 3000ms) for transient inference errors.
*   **Circuit Breaker**: If >5 consecutive inference failures occur, the AI circuit opens for 60 seconds, defaulting UI to manual search mode.
*   **Graceful Degradation**: If specific tools fail (e.g., `HRTool`), the system returns a partial success response indicating which domains are unavailable.
*   **Error Telemetry**: All failures are logged with structured error codes (`AI_PARSE_ERROR`, `AI_TIMEOUT`, `AI_HALLUCINATION`, `AI_LOW_CONFIDENCE`).
*   **Invalid JSON Fallback**: Returns a standard `UI_CLARIFICATION_REQUIRED` response if the LLM output is unparseable after retries.

### 5.4 Confidence Threshold Policy
To ensure high-integrity routing, the system evaluates the model's self-reported confidence (or heuristic certainty):
*   **Confidence < 0.4 (Hard Reject)**: System returns a "I didn't understand that" generic error. No DB query is attempted.
*   **Confidence 0.4 – 0.6 (Clarification)**: System prompts the user with buttons or suggestions: "Did you mean to check inventory or sales?"
*   **Confidence > 0.6 (Proceed)**: System executes the intent.
*   **Logging**: All events with confidence < 0.6 are flagged in the `ai_audit_log` for review and prompt tuning.

---

## 6. Schema Specification (The Command Contract)

Every AI response must strictly adhere to the following **Strict ENUM-Based** JSON interface.

### 6.1 Schema Definition
```json
{
  "schema_version": "1.0.0",
  "tool": "ENUM(inventory | sales | hr | system)",
  "action": "ENUM(See Section 6.2)",
  "params": {
    "filter": "string (Max 50 chars)",
    "limit": "integer (1-100, Default: 10)",
    "timeframe": "string (ISO8601 or Relative ENUM)",
    "threshold": "number (Optional)"
  },
  "confidence": "number (0.0 - 1.0)"
}
```

### 6.2 Action Enums & Validation Rules

#### Tool: `inventory`
*   **`LOW_STOCK`**:
    *   Params: `limit` (Req), `threshold` (Opt, Default: 10)
*   **`SEARCH_PRODUCT`**:
    *   Params: `filter` (Req, Min 3 chars)
*   **`CATEGORY_SUMMARY`**:
    *   Params: `filter` (Req: Category Name)

#### Tool: `sales`
*   **`TODAY_SUMMARY`**:
    *   Params: None
*   **`TOP_PRODUCTS`**:
    *   Params: `limit` (Req), `timeframe` (Req: `today` | `week` | `month`)
*   **`BRANCH_PERFORMANCE`**:
    *   Params: `timeframe` (Req)

#### Tool: `hr`
*   **`SHIFT_STATUS`**:
    *   Params: `timeframe` (Req: `current` | `next`)
*   **`PAYROLL_PREVIEW`**:
    *   Params: `filter` (Req: Employee Name or ID)

### 6.3 Contract Example
**User Query**: "Show me the top 5 selling snacks from last week."
**AI Output**:
```json
{
  "schema_version": "1.0.0",
  "tool": "sales",
  "action": "TOP_PRODUCTS",
  "params": {
    "filter": "snacks",
    "limit": 5,
    "timeframe": "last_week"
  },
  "confidence": 0.92
}
```

---

## 7. Logging & Observability
*   **Audit Trail**: Every AI request is logged with `user_id`, `original_prompt`, `detected_intent`, `inference_time`, and `sanitized_response`.
*   **Performance Monitoring**: Track "Parsing Failure Rate" and "Mean Inference Latency" to trigger model re-tuning or hardware upgrades.

---

## 8. Deployment Topology
*   **Development**: Local Ollama instance running on dev hardware.
*   **Production (V1)**: Dedicated AI microservice node (16GB RAM) within the local branch network.
*   **Edge Strategy**: High-traffic branches may host their own inference engine to ensure zero-latency offline processing.

---

## 9. Versioning & Change Management

### 9.1 Semantic Versioning
*   **Manifest Version**: `v1.x` (Tracks changes to the System Prompt and Tool definitions).
*   **Schema Version**: `v1.x` (Tracks changes to the JSON Output Contract).
*   **Tool Registry**: `v1.x` (Tracks available Service Layer endpoints).

### 9.2 Migration Policy
*   **Backward Compatibility**: The backend Parser must support `Schema Version N` and `N-1`.
*   **Deprecation**: When removing a Tool, the System Prompt is updated to explicitly state "X is no longer supported" to prevent hallucinations.
*   **Rollout**: New Prompt Versions are staged in a "Shadow Mode" (logging only) before going live to users.

---

## 10. Enterprise Testing Strategy

To ensure reliability, the AI layer is subjected to a rigorous testing framework:
1.  **Intent Accuracy Suite**: A library of 500+ "Golden Queries" (Natural Language -> Expected JSON) run automatically via CI/CD. Target > 95% pass rate.
2.  **Adversarial Test Suite**: Automated injection of jailbreak attempts and malformed inputs to verify the Defense Manifest.
3.  **Regression Testing**: Ensuring new Tools do not degrade the accuracy of existing Tools.
4.  **Load Testing**: Simulating concurrent requests to verify CPU fencing and Latency Budgets (Target: Stable at 5 concurrent requests).
5.  **Schema Validation**: Automated contract testing using JSON Schema to ensure the LLM output always matches the backend expectations.

---

## 11. Final Objective
To transform the POS from a passive data repository into an **Active Intelligence Hub**. The system will not just store data; it will understand operational context, allowing management to navigate multi-branch complexities with the clarity of a single-store operation.
