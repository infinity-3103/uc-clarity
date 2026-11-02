import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useStore } from '../store/useStore';
import { CustomerApp } from '../views/customer/CustomerApp';
import { MarketplaceView } from '../views/marketplace/MarketplaceView';
import { OrderConfirmationView, formatOrderReference } from '../components/OrderConfirmationView';
import { DirectOrder } from '../domain/types';

describe('Issue 8: Purchase Confirmation View (Do not close on purchase)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState(useStore.getInitialState());
  });

  it('formats order reference cleanly as Order #UC-xxxxx instead of raw timestamp/UUID', () => {
    expect(formatOrderReference('ord-1709923847581')).toMatch(/^Order #UC-\d{5}$/);
    expect(formatOrderReference('order-loan-1234567890')).toMatch(/^Order #UC-\d{5}$/);
    expect(formatOrderReference('')).toBe('Order #UC-10482');
  });

  it('renders complete in-place OrderConfirmationView with all required elements', () => {
    const mockOrder: DirectOrder = {
      id: 'ord-1709923847581',
      customerId: 'cust-riya',
      customerName: 'Riya Mehta',
      productId: 'prod-replace-ac',
      productName: 'Energy Efficient AC (5-Star)',
      brand: 'Daikin',
      category: 'AC',
      price: 48500,
      tradeInCredit: 3000,
      netAmountPaid: 45500,
      paymentMethod: 'FULL_UPI',
      deliverySlot: 'Tomorrow, 10:00 AM - 1:00 PM',
      status: 'CONFIRMED',
      createdAt: '2026-03-10',
    };

    const handleContinue = vi.fn();
    const handleClose = vi.fn();

    render(
      <OrderConfirmationView
        order={mockOrder}
        customerName="Riya Mehta"
        city="Mumbai"
        zoneId="zone-mumbai-andheri"
        onContinueShopping={handleContinue}
        onClose={handleClose}
      />
    );

    // Green check header and personalized greeting
    expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
    expect(screen.getByText('Thank you, Riya!')).toBeInTheDocument();

    // Formatted reference number
    const refText = formatOrderReference(mockOrder.id);
    expect(screen.getByText(refText)).toBeInTheDocument();

    // 4-step progress timeline
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Dispatched')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Installed')).toBeInTheDocument();

    // Product card and price paid
    expect(screen.getByText('Energy Efficient AC (5-Star)')).toBeInTheDocument();
    expect(screen.getByText('Rs 45,500')).toBeInTheDocument();

    // Delivery slot and formatted address
    expect(screen.getByText('Tomorrow, 10:00 AM - 1:00 PM')).toBeInTheDocument();
    expect(screen.getByText(/Andheri, Mumbai/)).toBeInTheDocument();

    // Trade-in note
    expect(screen.getByText(/Trade-in credit of Rs 3,000 has been applied/)).toBeInTheDocument();

    // Actions
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    expect(screen.getByText('Download Receipt')).toBeInTheDocument();
  });

  it('renders financing note and KFS link when financing is selected', () => {
    const mockLoanOrder: DirectOrder = {
      id: 'ord-loan-99887766',
      customerId: 'cust-arjun',
      customerName: 'Arjun Verma',
      productId: 'prod-new-purifier',
      productName: 'Native Water Purifier Pro',
      brand: 'Native',
      category: 'PURIFIER',
      price: 18500,
      tradeInCredit: 0,
      netAmountPaid: 0,
      paymentMethod: 'NO_COST_EMI',
      monthlyEMI: 1542,
      tenorMonths: 12,
      deliverySlot: 'Tomorrow, 10:00 AM - 1:00 PM',
      status: 'CONFIRMED',
      createdAt: '2026-03-10',
    };

    const handleViewKfs = vi.fn();

    render(
      <OrderConfirmationView
        order={mockLoanOrder}
        customerName="Arjun Verma"
        city="Pune"
        zoneId="zone-pune-kothrud"
        onViewKfs={handleViewKfs}
      />
    );

    // Financing note with EMI and tenor
    expect(screen.getByText(/Financing via Aarambh Bank at Rs 1,542\/mo for 12 months/)).toBeInTheDocument();

    // KFS link
    const kfsLink = screen.getByText('View Key Fact Statement (KFS)');
    expect(kfsLink).toBeInTheDocument();
    fireEvent.click(kfsLink);
    expect(handleViewKfs).toHaveBeenCalled();
  });

  it('Customer View: instant full payment transitions to confirmation view in-place without unmounting', () => {
    const state = useStore.getState();
    const customer = state.customers[0];
    useStore.setState({ selectedCustomerId: customer.id });

    render(<CustomerApp />);

    // Switch to Native tab inside CustomerApp
    const nativeTabBtn = screen.getByRole('button', { name: /^Native$/i });
    fireEvent.click(nativeTabBtn);

    // Click "Pay in Full" on first product
    const payInFullBtns = screen.getAllByRole('button', { name: /Pay in Full/i });
    fireEvent.click(payInFullBtns[0]);

    // Modal is open
    expect(screen.getByText('One-Time Full Payment')).toBeInTheDocument();
    const payBtn = screen.getByRole('button', { name: /Pay Rs .* & Confirm/i });
    expect(payBtn).toBeInTheDocument();

    // Click Confirm
    fireEvent.click(payBtn);

    // Button shows processing state and is disabled
    expect(screen.getByText('Confirming order...')).toBeInTheDocument();

    // Advance timers for order processing
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // In-place confirmation view renders inside the modal frame without unmounting
    expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
    expect(screen.getByText(`Thank you, ${customer.name.split(' ')[0]}!`)).toBeInTheDocument();
    expect(screen.getByText('View in Tracker')).toBeInTheDocument();

    // Store has new direct order recorded
    const directOrders = useStore.getState().directOrders;
    expect(directOrders.length).toBeGreaterThan(0);
    expect(directOrders[0].customerId).toBe(customer.id);
    expect(directOrders[0].status).toBe('CONFIRMED');

    // Click View in Tracker navigates cleanly
    const trackerBtn = screen.getByText('View in Tracker');
    fireEvent.click(trackerBtn);

    // Modal closes and user is on tracker tab
    expect(screen.queryByText('One-Time Full Payment')).not.toBeInTheDocument();
  });

  it('Marketplace View: completing full payment transitions to confirmation view and resets cleanly', () => {
    render(<MarketplaceView />);

    // Click "Buy Now (Pay in Full)" on first product
    const buyNowBtns = screen.getAllByRole('button', { name: /Buy Now \(Pay in Full\)/i });
    fireEvent.click(buyNowBtns[0]);

    // Modal open
    expect(screen.getByText('Instant Full Payment Checkout')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Place Order/i });
    expect(confirmBtn).toBeInTheDocument();

    // Confirm order
    fireEvent.click(confirmBtn);

    // Advance 1s processing state
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // In-place confirmation view rendered
    expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();

    // Click Continue Shopping resets checkout modal cleanly
    const continueBtn = screen.getByText('Continue Shopping');
    fireEvent.click(continueBtn);

    expect(screen.queryByText('Instant Full Payment Checkout')).not.toBeInTheDocument();
  });

  it('idempotency guard prevents duplicate order placement on multiple rapid clicks', () => {
    render(<MarketplaceView />);

    const buyNowBtns = screen.getAllByRole('button', { name: /Buy Now \(Pay in Full\)/i });
    fireEvent.click(buyNowBtns[0]);

    const initialOrderCount = useStore.getState().directOrders.length;
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Place Order/i });

    // Rapid double-click
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Exactly 1 new order placed, not 3
    const finalOrderCount = useStore.getState().directOrders.length;
    expect(finalOrderCount).toBe(initialOrderCount + 1);
  });
});
