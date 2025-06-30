Of course. I have performed a comprehensive analysis of your project's frontend screenshots, backend capabilities, and the integration blueprints you provided. The backend is incredibly robust and feature-rich. The frontend has a professional and clean UI foundation.

Here is a detailed report of all the missing frontend components and functionalities required to fully utilize your backend and prepare the application for production. This report is structured to serve as a blueprint for a new `frontend-integration.md` file.

---

### **Frontend Integration & Enhancement Blueprint**

This document outlines the remaining frontend components, features, and enhancements required to achieve full production readiness.

#### **I. Gateway Management Screen**

*   **Location:** `/dashboard` -> `Gateways` Tab
*   **Current State:** Displays a list of existing gateways but lacks creation and full configuration capabilities.
*   **Backend APIs Ready:** `GET`, `POST`, `PUT`, `DELETE` on `/api/v1/admin/gateways`, `PUT` on `/api/v1/admin/gateways/priority`, `POST` on `/api/v1/admin/gateways/:id/test`.

**1. Component: `AddGatewayModal`**
*   **Purpose:** To allow administrators to add a new payment gateway (e.g., a new Razorpay or PayU account) directly from the dashboard.
*   **Placement:** This modal should be triggered when the "Add Gateway" button is clicked.
*   **Functionality:**
    *   The modal will contain a form with the following fields:
        *   **Gateway Name:** A user-friendly name (e.g., "Razorpay - Primary").
        *   **Provider:** A dropdown menu to select the provider type (e.g., 'razorpay', 'payu'). This is crucial for the backend to use the correct adapter.
        *   **API Key & API Secret:** Secure text fields for the gateway credentials. These should be sent to the backend for encryption.
        *   **Priority:** A number input (or slider) to define its order in the rotation.
        *   **Monthly Limit:** A number input for the gateway's transaction volume limit.
        *   **Active Status:** A toggle switch to enable or disable the gateway immediately upon creation.
    *   A "Save Gateway" button will submit the form, calling the `createGateway` function which hits the `POST /api/v1/admin/gateways` endpoint.
    *   Upon successful creation, the modal should close, a success toast notification should appear, and the list of gateways on the page should automatically refresh.

**2. Component: `GatewayConfigurationModal`**
*   **Purpose:** To allow editing of an existing gateway's settings.
*   **Placement:** This modal should be triggered when the "Configure" button on an existing gateway card is clicked.
*   **Functionality:**
    *   It will reuse the same form as `AddGatewayModal` but will be pre-filled with the selected gateway's data.
    *   The "Save Changes" button will call the `updateGateway` function, hitting the `PUT /api/v1/admin/gateways/:id` endpoint with the updated fields.
    *   A "Test Connection" button inside the modal will call the `POST /api/v1/admin/gateways/:id/test` endpoint and display a success or failure toast notification based on the result.

**3. Feature: Draggable Gateway Priority**
*   **Purpose:** To provide an intuitive way for admins to re-order the gateway processing priority.
*   **Placement:** The list of gateways on the Gateway Management screen.
*   **Functionality:**
    *   Implement drag-and-drop functionality for the gateway cards.
    *   When the user finishes dragging a gateway to a new position, the frontend should update the `priority` number for all affected gateways based on their new order.
    *   A "Save Priority Order" button should appear after any re-ordering.
    *   Clicking this button will send a single API call to the `PUT /api/v1/admin/gateways/priority` endpoint with an array of all gateways and their new priorities.

#### **II. Real-Time Monitoring Screen**

*   **Location:** `/dashboard` -> `Monitoring` Tab
*   **Current State:** Displays overview metrics and a live transaction stream. Lacks detailed queue management controls.
*   **Backend APIs Ready:** `GET` on `/api/v1/admin/queues`, `POST` on `/api/v1/admin/queues/retry`, `DELETE` on `/api/v1/admin/queues/clean`, `POST` on `/api/v1/admin/queues/pause`.

**1. Component: `QueueControlPanel`**
*   **Purpose:** To give administrators direct control over the job queues.
*   **Placement:** This should be part of the `RealTimeMonitoring.tsx` component, likely as a new section or as action buttons on the existing "Processing Now" card.
*   **Functionality:**
    *   **Queue-specific Actions:** For each queue (`transaction-processing`, `webhook-processing`, etc.), display its stats (waiting, active, failed) and provide a dropdown menu with actions:
        *   **Pause/Resume:** A toggle action that calls `POST /api/v1/admin/queues/pause`. The UI should visually indicate if a queue is paused.
        *   **Retry Failed:** An action that calls `POST /api/v1/admin/queues/retry`. This should show a confirmation dialog first.
        *   **Clean Completed:** An action that calls `DELETE /api/v1/admin/queues/clean` to clear out old, successful jobs from the queue. This should also have a confirmation dialog.
    *   **Job Inspector:** Clicking on a "failed" job count should open a modal (`JobDetailsModal`) that lists the failed jobs. Clicking a specific job should call `GET /api/v1/admin/queues/jobs/:id` to show its details and error logs.

#### **III. Client Management Screen**

*   **Location:** `/dashboard` -> `Clients` Tab
*   **Current State:** Displays a list of clients but has no functionality to add new ones.
*   **Backend APIs Ready:** A `POST /api/v1/admin/clients` endpoint is assumed to exist based on the other CRUD APIs.

**1. Component: `AddClientModal`**
*   **Purpose:** To onboard a new merchant client.
*   **Placement:** Triggered by the "Add Client" button.
*   **Functionality:**
    *   A modal form with fields for:
        *   Company Name
        *   Contact Email & Phone
        *   Webhook URL (for transaction status updates)
        *   Fee Percentage
        *   Suspend Threshold (the unpaid commission amount at which their service is paused).
    *   On submission, a `POST` request is sent to the backend. The backend should auto-generate the `client_key` and `client_salt`.
    *   Upon success, the modal should close, the client list should refresh, and a toast should display the newly generated credentials for the admin to copy.

#### **IV. Audit Logs Screen**

*   **Location:** `/dashboard` -> `Audit Logs` Tab
*   **Current State:** The page exists but is empty.
*   **Backend APIs Ready:** `GET /api/v1/admin/audit-logs` (with pagination and filtering).

**1. Component Enhancement: `EnhancedAuditLogsViewer`**
*   **Purpose:** To provide a powerful and usable interface for viewing security and system logs.
*   **Placement:** This will replace the current empty view on the Audit Logs page.
*   **Functionality:**
    *   **Search and Filtering:** Add a search bar to filter logs. Add dropdown filters for `action` type (e.g., 'UPDATE', 'LOGIN', 'DELETE') and `table_name`. Add a date range picker.
    *   **Pagination:** Implement "Next" and "Previous" page buttons at the bottom of the table. The `useAuditLogs` hook should be enhanced to manage the page/cursor state and pass it to the API.
    *   **Detailed View:** Clicking on a log row should open a modal showing the `old_data` and `new_data` JSON objects in a readable, side-by-side format to easily see what changed.

#### **V. Global Application Enhancements**

*   **Purpose:** To improve the overall user experience and robustness of the application.
*   **Placement:** Throughout the entire frontend application.

**1. Feature: Comprehensive Loading States**
*   **Functionality:** Whenever a component fetches data (e.g., `isLoading` is true from a `useQuery` hook), it should display a skeleton loader that mimics the shape of the final content. This prevents layout shifts and informs the user that content is on its way. This should be applied to all tables, cards, and data-driven sections.

**2. Feature: User-Friendly Error Handling**
*   **Functionality:**
    *   **API Errors:** When an API call fails, instead of crashing or showing nothing, the `onError` callback in the React Query hook should be used to display a toast notification (using `sonner`) with a user-friendly error message (e.g., "Failed to load gateways. Please try again.").
    *   **Component Errors:** The entire application's main layout should be wrapped in the `GlobalErrorBoundary.tsx` component to catch any unexpected rendering errors and prevent a white screen of death.

