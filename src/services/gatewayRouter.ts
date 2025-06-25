export class GatewayRouter {
  private currentIndex = 0;

  public getNextGateway(): PaymentGateway {
    const gateway = availableGateways[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % availableGateways.length;
    return gateway;
  }
} 