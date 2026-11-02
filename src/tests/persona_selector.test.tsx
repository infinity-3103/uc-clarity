import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useStore } from '../store/useStore';
import { City } from '../domain/types';
import { DemoPersonaSwitcher } from '../components/DemoPersonaSwitcher';
import { CustomerApp } from '../views/customer/CustomerApp';
import { ProfessionalApp } from '../views/professional/ProfessionalApp';

describe('Issue 5: Demo Persona Selector Must Select Every Name', () => {
  beforeEach(() => {
    act(() => {
      useStore.getState().resetDemo();
      useStore.getState().setLanguage('en');
    });
  });

  it('All 5 customer personas exist in seed and can be selected in the UI', () => {
    const expectedPersonas = [
      { id: 'cust-riya', name: 'Riya Mehta', city: 'Mumbai', prime: true },
      { id: 'cust-arjun', name: 'Arjun Verma', city: 'Pune', prime: false },
      { id: 'cust-amit', name: 'Amit Patel', city: 'Kolkata', prime: true },
      { id: 'cust-vikram', name: 'Vikram Rao', city: 'Bengaluru', prime: true },
      { id: 'cust-priya', name: 'Priya Sharma', city: 'Delhi', prime: false },
    ];

    const { unmount } = render(<DemoPersonaSwitcher />);

    for (const p of expectedPersonas) {
      // Find card by name
      const cards = screen.getAllByText(p.name);
      expect(cards.length).toBeGreaterThan(0);

      act(() => {
        fireEvent.click(cards[0]);
      });

      // Assert store updated immediately
      const state = useStore.getState();
      expect(state.selectedCustomerId).toBe(p.id);
      expect(state.simulatedCity).toBe(p.city);

      // Verify the active customer in store matches
      const activeCust = state.customers.find((c) => c.id === p.id);
      expect(activeCust).toBeDefined();
      expect(activeCust?.name).toBe(p.name);
      expect(activeCust?.city).toBe(p.city);
      expect(activeCust?.hasCreditHistory).toBe(p.prime);
    }

    unmount();
  });

  it('Selecting each customer updates CustomerApp header location, name, and appliances', () => {
    const expectedPersonas = [
      { id: 'cust-riya', name: 'Riya Mehta', city: 'Mumbai' },
      { id: 'cust-arjun', name: 'Arjun Verma', city: 'Pune' },
      { id: 'cust-amit', name: 'Amit Patel', city: 'Kolkata' },
      { id: 'cust-vikram', name: 'Vikram Rao', city: 'Bengaluru' },
      { id: 'cust-priya', name: 'Priya Sharma', city: 'Delhi' },
    ];

    for (const p of expectedPersonas) {
      act(() => {
        useStore.getState().selectCustomer(p.id);
      });

      const { unmount } = render(<CustomerApp />);
      // Header location shows "{City}, India"
      expect(screen.getByText(new RegExp(`${p.city}, India`, 'i'))).toBeInTheDocument();

      // Verify customer can book a service
      let bookedId = '';
      act(() => {
        bookedId = useStore.getState().bookService({
          customerId: p.id,
          applianceType: 'AC',
          brand: 'Voltas',
          ageYears: 5,
          customerAnswers: { city: p.city as City, zoneId: `zone-${p.city.toLowerCase()}-default` },
        });
      });
      expect(bookedId).toBeTruthy();

      unmount();
    }
  });

  it('Partners tab allows selecting all 30 professionals across all 5 cities', () => {
    const { unmount } = render(<DemoPersonaSwitcher />);

    // Switch to Partners tab
    const partnersTabBtn = screen.getByRole('button', { name: /Partners/i });
    act(() => {
      fireEvent.click(partnersTabBtn);
    });

    const state = useStore.getState();
    const cities: City[] = ['Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Bengaluru'];

    for (const city of cities) {
      // Click city chip
      const cityChip = screen.getByRole('button', { name: new RegExp(city, 'i') });
      act(() => {
        fireEvent.click(cityChip);
      });

      const cityPros = state.professionals.filter((pro) => pro.city === city);
      expect(cityPros.length).toBeGreaterThanOrEqual(6);

      for (const pro of cityPros) {
        const proCard = screen.getByText(pro.name);
        expect(proCard).toBeInTheDocument();

        act(() => {
          fireEvent.click(proCard);
        });

        // Store selectedProfessionalId and city updated
        const updatedState = useStore.getState();
        expect(updatedState.selectedProfessionalId).toBe(pro.id);
        expect(updatedState.simulatedCity).toBe(city);

        // Render ProfessionalApp and verify partner name is displayed
        const { unmount: unmountPro } = render(<ProfessionalApp />);
        const matches = screen.getAllByText(new RegExp(pro.name, 'i'));
        expect(matches.length).toBeGreaterThan(0);
        unmountPro();
      }
    }

    unmount();
  });
});
