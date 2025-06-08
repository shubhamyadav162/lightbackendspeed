# LightSpeedPay - Dashboard User Manual

## Introduction

This user manual provides detailed instructions for using the LightSpeedPay dashboards. It covers both the Merchant Dashboard and Admin Dashboard interfaces, explaining key features and common workflows.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Merchant Dashboard](#merchant-dashboard)
3. [Admin Dashboard](#admin-dashboard)
4. [Common Tasks](#common-tasks)
5. [Monitoring System](#monitoring-system)
6. [Reports and Analytics](#reports-and-analytics)
7. [Settings and Configuration](#settings-and-configuration)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Dashboard

1. Navigate to `https://dashboard.lightspeedpay.com`
2. Enter your email and password
3. For enhanced security, complete the two-factor authentication if enabled
4. You will be redirected to your dashboard based on your role (Merchant or Admin)

### Dashboard Navigation

The dashboard uses a sidebar navigation system with the following sections:

- **Overview**: Summary of key metrics and recent activity
- **Transactions**: Detailed transaction listings and management
- **Customers**: Customer management (Admin only)
- **Merchants**: Merchant management (Admin only)
- **Gateways**: Payment gateway configuration
- **Webhooks**: Webhook configuration and logs
- **Monitoring**: System health and performance metrics
- **Reports**: Detailed analytics and exportable reports
- **Settings**: Account and system configuration

## Merchant Dashboard

### Overview Section

The Merchant Dashboard overview provides:

- **Transaction Summary**: Total volume, success rate, and revenue
- **Recent Transactions**: List of 10 most recent transactions
- **Quick Stats**: Key performance indicators
- **Announcements**: System updates and important notices

![Merchant Dashboard Overview](https://assets.lightspeedpay.com/docs/merchant-overview.png)

### Transaction Management

To view and manage transactions:

1. Click on **Transactions** in the sidebar
2. Use filters to narrow results by date, amount, status, or payment method
3. Click on any transaction ID to view detailed information
4. Use the **Actions** menu to perform operations like refunds or capturing authorized payments

### Transaction Details

The transaction details page shows:

- Basic transaction information (amount, date, status)
- Customer details
- Payment method information
- Timeline of transaction events
- Related transactions (refunds, captures)
- Gateway response details for debugging

### Webhook Configuration

To set up webhooks for real-time notifications:

1. Navigate to **Webhooks** in the sidebar
2. Click **Add Endpoint** to create a new webhook
3. Enter the endpoint URL (must be HTTPS)
4. Select events you want to receive (transaction.success, transaction.failed, etc.)
5. Set a secret key for signature verification
6. Enable/disable the webhook as needed
7. View delivery logs to monitor webhook performance

### Monitoring Dashboard

The Merchant Monitoring Dashboard provides:

1. **Transaction Volume**: Hourly/daily transaction counts
2. **Success Rate**: Percentage of successful transactions over time
3. **Payment Method Distribution**: Breakdown by payment method
4. **Recent Transactions**: Latest transaction activity
5. **System Status**: Health indicators for critical services

To use the monitoring dashboard:

1. Navigate to **Monitoring** in the sidebar
2. Select the desired time range from the dropdown
3. Use the refresh button to update data
4. Click on charts for detailed breakdowns
5. Switch between tabs for different monitoring aspects

## Admin Dashboard

### Overview Section

The Admin Dashboard provides a platform-wide view:

- **System Health**: Overall platform health indicators
- **Transaction Volume**: Platform-wide transaction metrics
- **Active Merchants**: Quick view of merchant activity
- **Gateway Performance**: Success rates by gateway
- **Recent Alerts**: System alerts requiring attention

### Merchant Management

To manage merchants:

1. Navigate to **Merchants** in the sidebar
2. View the list of all merchants on the platform
3. Use search and filters to find specific merchants
4. Click on a merchant name to view detailed information
5. Use the **Actions** menu to edit details, adjust limits, or suspend accounts

### Gateway Configuration

To configure payment gateways:

1. Navigate to **Gateways** in the sidebar
2. View the list of available payment gateways
3. Click **Edit** to modify gateway configuration
4. Set priority order for the gateway selection algorithm
5. Configure failover rules and thresholds
6. Set gateway-specific parameters and credentials

### System Monitoring

The Admin Monitoring Dashboard provides:

1. **System Status**: Health of all system components
2. **Transaction Volume**: Platform-wide transaction charts
3. **Gateway Performance**: Detailed gateway metrics
4. **Error Distribution**: Breakdown of transaction errors
5. **Background Jobs**: Status of background processing jobs
6. **Alert Management**: System alerts and configuration

To use the admin monitoring dashboard:

1. Navigate to **Monitoring** in the sidebar
2. Select the desired time range from the dropdown
3. Use the refresh button to update data
4. Switch between tabs for different monitoring aspects:
   - **Overview**: General system health
   - **Gateways**: Gateway-specific performance
   - **Jobs**: Background job status
   - **Alerts**: System alerts and configuration

## Common Tasks

### Processing a Refund

To process a refund:

1. Navigate to **Transactions** in the sidebar
2. Find the transaction to refund using filters
3. Click on the transaction ID to open details
4. Click the **Refund** button
5. Enter refund amount (full or partial)
6. Add a reason for the refund
7. Click **Confirm** to process the refund

### Viewing Reports

To generate and view reports:

1. Navigate to **Reports** in the sidebar
2. Select the report type:
   - Transaction Summary
   - Gateway Performance
   - Settlement Report
   - Reconciliation Report
3. Set the date range for the report
4. Apply any additional filters
5. Click **Generate Report**
6. View the report in the browser or export to CSV/Excel

### Configuring Alerts

To set up system alerts:

1. Navigate to **Monitoring** in the sidebar
2. Select the **Alerts** tab
3. Click **Add Alert Configuration**
4. Select the metric to monitor (e.g., error rate, response time)
5. Set the threshold value that triggers the alert
6. Set the duration the threshold must be exceeded
7. Select the severity level
8. Choose notification channels (email, SMS, Slack)
9. Set a cooldown period to prevent alert storms
10. Click **Save Configuration**

## Monitoring System

### Time Range Selection

All monitoring dashboards allow selecting different time ranges:
- Last Hour
- Last 6 Hours
- Last 24 Hours
- Last 7 Days
- Last 30 Days

### Data Refresh

Data can be refreshed manually by clicking the **Refresh** button in the top right corner of the dashboard.

### Merchant Monitoring Features

The Merchant Monitoring Dashboard includes:
1. **Transaction Volume Chart**: Shows hourly transaction volume
2. **Success Rate Chart**: Displays success percentage over time
3. **Payment Methods Chart**: Distribution of payment methods
4. **Recent Transactions**: Table of latest transactions
5. **System Status Cards**: Health indicators for key services

### Admin Monitoring Features

The Admin Monitoring Dashboard includes:
1. **System Status Cards**: Health of all system components
2. **Transaction Volume Chart**: Platform-wide transaction metrics
3. **Error Distribution Chart**: Breakdown of transaction errors
4. **Gateway Performance Table**: Success rates and response times
5. **Background Jobs Table**: Status of system jobs
6. **Recent Alerts Table**: System alerts requiring attention

## Reports and Analytics

### Available Reports

The following reports are available:

1. **Transaction Summary**: Overview of transaction volume and revenue
2. **Gateway Performance**: Success rates and response times by gateway
3. **Settlement Report**: Reconciliation with payment gateways
4. **Merchant Performance**: Transaction metrics by merchant
5. **Error Analysis**: Detailed breakdown of transaction errors
6. **Custom Reports**: Build reports with custom dimensions and metrics

### Exporting Data

Reports can be exported in the following formats:
- CSV
- Excel
- PDF
- JSON (for API integrations)

## Settings and Configuration

### Account Settings

To update your account settings:

1. Click your profile icon in the top right corner
2. Select **Account Settings**
3. Update your profile information
4. Change password
5. Configure two-factor authentication
6. Set communication preferences

### API Credentials

To manage API credentials:

1. Navigate to **Settings** > **API** in the sidebar
2. View your current API keys
3. Generate new API keys
4. Revoke compromised API keys
5. Set IP restrictions for API access

### User Management

For administrators to manage users:

1. Navigate to **Settings** > **Users** in the sidebar
2. View the list of users
3. Add new users
4. Edit user roles and permissions
5. Disable or delete user accounts

## Troubleshooting

### Common Issues

#### Dashboard Loading Slowly
- Clear browser cache
- Check internet connection
- Try a different browser
- Contact support if the issue persists

#### Transaction Not Showing Up
- Check the time filter settings
- Verify the transaction was submitted correctly
- Look for the transaction in the API logs
- Contact support with the transaction reference

#### Webhook Delivery Failures
- Verify the endpoint URL is correct and accessible
- Check server logs for error details
- Ensure the webhook signature is being validated correctly
- Test the endpoint with the webhook simulator

### Getting Help

If you encounter issues not covered in this manual:

1. Check the [Help Center](https://help.lightspeedpay.com) for articles and guides
2. Contact support through the dashboard by clicking **Help** > **Contact Support**
3. Email support@lightspeedpay.com
4. For urgent issues, call the support hotline at +1-800-LIGHTSPEED

## Keyboard Shortcuts

For power users, the following keyboard shortcuts are available:

- **Ctrl+D**: Toggle dark mode
- **Ctrl+/**: Open search
- **Ctrl+F**: Filter current view
- **Ctrl+R**: Refresh data
- **Esc**: Close current dialog 