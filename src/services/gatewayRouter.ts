import { PaymentGateway } from '../types';

// Define the available gateways array
const availableGateways: PaymentGateway[] = [];

export class GatewayRouter {
  private currentIndex = 0;

  public getNextGateway(): PaymentGateway {
    if (availableGateways.length === 0) {
      throw new Error('No payment gateways available');
    }
    const gateway = availableGateways[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % availableGateways.length;
    return gateway;
  }

  public setAvailableGateways(gateways: PaymentGateway[]): void {
    // Clear the array
    availableGateways.length = 0;
    // Add all new gateways
    availableGateways.push(...gateways);
  }
} 