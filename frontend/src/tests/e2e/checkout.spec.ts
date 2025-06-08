import { v4 as uuidv4 } from 'uuid';

describe('Checkout Flow', () => {
  // Test merchant and transaction data
  const testMerchantId = Cypress.env('TEST_MERCHANT_ID');
  const testAmount = 1000; // ₹10.00
  const testCurrency = 'INR';
  const testTransactionId = uuidv4();
  
  beforeEach(() => {
    // Set up test transaction in the database using the Cypress task
    cy.task('setupTestTransaction', {
      merchantId: testMerchantId,
      transactionId: testTransactionId,
      amount: testAmount,
      currency: testCurrency,
    });
  });

  it('should complete a checkout flow successfully', () => {
    // Visit the checkout page with merchant and transaction IDs
    cy.visit(`/checkout/${testMerchantId}/${testTransactionId}`);
    
    // Verify merchant info is displayed
    cy.get('[data-testid="merchant-name"]').should('be.visible');
    cy.get('[data-testid="transaction-amount"]').should('contain', `${testAmount/100}`);
    cy.get('[data-testid="transaction-currency"]').should('contain', testCurrency);
    
    // Fill out customer information
    cy.get('[data-testid="customer-email"]').type('test-customer@example.com');
    cy.get('[data-testid="customer-phone"]').type('9876543210');
    
    // Proceed to payment methods
    cy.get('[data-testid="proceed-button"]').click();
    
    // Verify payment methods are loaded
    cy.get('[data-testid="payment-methods"]').should('be.visible');
    
    // Select a payment method (e.g., credit card)
    cy.get('[data-testid="payment-method-card"]').click();
    
    // Fill credit card details in the test form
    cy.get('[data-testid="card-number"]').type('4111111111111111');
    cy.get('[data-testid="card-expiry"]').type('1225');
    cy.get('[data-testid="card-cvv"]').type('123');
    cy.get('[data-testid="card-name"]').type('Test User');
    
    // Submit payment
    cy.get('[data-testid="pay-button"]').click();
    
    // Wait for processing
    cy.get('[data-testid="processing-payment"]').should('be.visible');
    
    // In test mode, we simulate a successful payment response
    cy.task('simulatePaymentSuccess', { transactionId: testTransactionId });
    
    // Verify success screen is shown
    cy.get('[data-testid="payment-success"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="transaction-id"]').should('contain', testTransactionId);
    
    // Verify the "Return to Merchant" button is displayed
    cy.get('[data-testid="return-to-merchant"]').should('be.visible');
  });

  it('should handle payment failures properly', () => {
    // Visit the checkout page with merchant and transaction IDs
    cy.visit(`/checkout/${testMerchantId}/${testTransactionId}`);
    
    // Verify merchant info is displayed
    cy.get('[data-testid="merchant-name"]').should('be.visible');
    
    // Fill out customer information
    cy.get('[data-testid="customer-email"]').type('test-customer@example.com');
    cy.get('[data-testid="customer-phone"]').type('9876543210');
    
    // Proceed to payment methods
    cy.get('[data-testid="proceed-button"]').click();
    
    // Select a payment method (e.g., credit card)
    cy.get('[data-testid="payment-method-card"]').click();
    
    // Fill credit card details with a card that will be declined
    cy.get('[data-testid="card-number"]').type('4000000000000002'); // Decline card
    cy.get('[data-testid="card-expiry"]').type('1225');
    cy.get('[data-testid="card-cvv"]').type('123');
    cy.get('[data-testid="card-name"]').type('Test User');
    
    // Submit payment
    cy.get('[data-testid="pay-button"]').click();
    
    // Wait for processing
    cy.get('[data-testid="processing-payment"]').should('be.visible');
    
    // Simulate payment failure
    cy.task('simulatePaymentFailure', { 
      transactionId: testTransactionId,
      errorMessage: 'Your card was declined'
    });
    
    // Verify error message is shown
    cy.get('[data-testid="payment-error"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Your card was declined');
    
    // Verify the "Try Again" button is displayed
    cy.get('[data-testid="try-again-button"]').should('be.visible');
  });

  it('should automatically retry another gateway on failure', () => {
    // Visit the checkout page
    cy.visit(`/checkout/${testMerchantId}/${testTransactionId}`);
    
    // Fill out customer information
    cy.get('[data-testid="customer-email"]').type('test-customer@example.com');
    cy.get('[data-testid="customer-phone"]').type('9876543210');
    
    // Proceed to payment
    cy.get('[data-testid="proceed-button"]').click();
    
    // Select a payment method
    cy.get('[data-testid="payment-method-card"]').click();
    
    // Fill card details
    cy.get('[data-testid="card-number"]').type('4111111111111111');
    cy.get('[data-testid="card-expiry"]').type('1225');
    cy.get('[data-testid="card-cvv"]').type('123');
    cy.get('[data-testid="card-name"]').type('Test User');
    
    // Submit payment
    cy.get('[data-testid="pay-button"]').click();
    
    // Simulate gateway failure (not card decline)
    cy.task('simulateGatewayFailure', { transactionId: testTransactionId });
    
    // Verify that automatic retry message is shown
    cy.get('[data-testid="gateway-retry"]', { timeout: 10000 }).should('be.visible');
    
    // Simulate second gateway success
    cy.task('simulateSecondGatewaySuccess', { transactionId: testTransactionId });
    
    // Verify payment success
    cy.get('[data-testid="payment-success"]', { timeout: 10000 }).should('be.visible');
  });
}); 