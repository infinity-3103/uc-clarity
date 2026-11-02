import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useStore } from '../store/useStore';
import { City, ApplianceType } from '../domain/types';
import { assertAllAssignmentsOpenable } from '../domain/validation';
import { CustomerApp } from '../views/customer/CustomerApp';
import { ProfessionalApp } from '../views/professional/ProfessionalApp';

describe('Issue 4: Remove "View in partner app", auto-select the partner instead', () => {
  beforeEach(() => {
    act(() => {
      useStore.getState().resetDemo();
      useStore.getState().setLanguage('en');
    });
  });

  it('No "View in partner app" button exists anywhere in CustomerApp', () => {
    render(<CustomerApp />);
    expect(screen.queryByText(/View in partner app/i)).toBeNull();
    expect(screen.queryByTitle(/View in partner app/i)).toBeNull();
  });

  it('Booking a service in each city auto-selects the assigned partner in the correct city and displays the job in their Jobs tab', () => {
    const cities: City[] = ['Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Bengaluru'];
    const appliance: ApplianceType = 'AC';

    for (const city of cities) {
      // Find a customer in that city
      const customer = useStore.getState().customers.find((c) => c.city === city) || useStore.getState().customers[0];

      let newJobId = '';
      act(() => {
        newJobId = useStore.getState().bookService({
          customerId: customer.id,
          applianceType: appliance,
          brand: 'Voltas',
          ageYears: 5,
          customerAnswers: { city: customer.city, zoneId: customer.zoneId },
        });
      });

      expect(newJobId).toBeTruthy();

      const state = useStore.getState();
      const assignedProId = state.selectedProfessionalId;
      expect(assignedProId).toBeTruthy();

      const assignedPro = state.professionals.find((p) => p.id === assignedProId);
      expect(assignedPro).toBeDefined();
      expect(assignedPro?.city).toBe(customer.city);
      expect(state.simulatedCity).toBe(customer.city);

      // Verify the job was assigned to this professional
      const createdJob = state.serviceRequests.find((r) => r.id === newJobId);
      expect(createdJob).toBeDefined();
      expect(createdJob?.professionalId).toBe(assignedProId);
      expect(createdJob?.status).toBe('ASSIGNED');

      // Assert assertAllAssignmentsOpenable passes
      expect(assertAllAssignmentsOpenable(state)).toBe(true);

      // Render ProfessionalApp and verify the assigned partner and job are displayed
      const { unmount } = render(<ProfessionalApp />);
      expect(screen.getByText(new RegExp(assignedPro!.name, 'i'))).toBeInTheDocument();
      expect(screen.getByText(/New job assigned/i)).toBeInTheDocument();
      unmount();
    }
  });

  it('Partner selection does not reset on re-render', () => {
    const state = useStore.getState();
    const targetPro = state.professionals.find((p) => p.city === 'Delhi');
    expect(targetPro).toBeDefined();

    act(() => {
      useStore.getState().selectProfessional(targetPro!.id);
    });

    const { unmount, rerender } = render(<ProfessionalApp />);
    expect(screen.getByText(new RegExp(targetPro!.name, 'i'))).toBeInTheDocument();

    rerender(<ProfessionalApp />);
    expect(useStore.getState().selectedProfessionalId).toBe(targetPro!.id);
    expect(screen.getByText(new RegExp(targetPro!.name, 'i'))).toBeInTheDocument();
    unmount();
  });
});
