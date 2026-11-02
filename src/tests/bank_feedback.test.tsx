import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useStore } from '../store/useStore';
import { BankFeedbackSheet } from '../components/BankFeedbackSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';

describe('Issue 2: Replace Browser Dialogs with In-App UI', () => {
  beforeEach(() => {
    useStore.getState().resetDemo();
  });

  it('renders BankFeedbackSheet with mode toggle, topics, and message validation', () => {
    const handleClose = () => {};
    render(
      <BankFeedbackSheet
        isOpen={true}
        customerId="cust-riya"
        loanId="loan-123"
        initialMode="COMPLAINT"
        onClose={handleClose}
      />
    );

    // Dialog elements
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Aarambh Bank Support & Feedback/i)).toBeInTheDocument();

    // Mode buttons
    const feedbackModeBtn = screen.getByText(/^Feedback$/i);
    const complaintModeBtn = screen.getByText(/^Complaint \/ Grievance$/i);
    expect(feedbackModeBtn).toBeInTheDocument();
    expect(complaintModeBtn).toBeInTheDocument();

    // Topic chips
    expect(screen.getByText('Loan terms')).toBeInTheDocument();
    expect(screen.getByText('Cooling-off')).toBeInTheDocument();

    // Submit button should be disabled when message has less than 10 chars
    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    expect(submitBtn).toBeDisabled();

    // Type 5 characters
    const textarea = screen.getByPlaceholderText(/Describe your query, grievance, or feedback/i);
    fireEvent.change(textarea, { target: { value: 'Short' } });
    fireEvent.blur(textarea);

    expect(screen.getByText(/Please enter at least 10 characters/i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Type valid message >= 10 chars
    fireEvent.change(textarea, { target: { value: 'This is a detailed complaint about loan interest charges.' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('submitting complaint creates bankFeedback entry, sets grievance on loan, and shows reference number', () => {
    // Seed loan application
    const store = useStore.getState();
    const loan = store.submitLoanApplication({
      requestId: 'req-1',
      customerId: 'cust-riya',
      productId: 'prod-ac-1',
      productName: 'Energy Efficient AC',
      principal: 45000,
      tenorMonths: 12,
      tradeInCredit: 3000,
      path: 'BUREAU',
    });

    render(
      <BankFeedbackSheet
        isOpen={true}
        customerId="cust-riya"
        loanId={loan.id}
        initialMode="COMPLAINT"
        onClose={() => {}}
      />
    );

    const textarea = screen.getByPlaceholderText(/Describe your query, grievance, or feedback/i);
    fireEvent.change(textarea, { target: { value: 'Inappropriate interest charges applied contrary to zero interest.' } });

    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitBtn);

    // Verify success state
    expect(screen.getByText(/Ticket Submitted Successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/^BF-0001$/)).toBeInTheDocument();
    expect(screen.getByText(/Our customer grievance officer will review your ticket within 24 business hours/i)).toBeInTheDocument();

    // Verify Zustand state
    const feedbackList = useStore.getState().bankFeedback;
    expect(feedbackList.length).toBe(1);
    expect(feedbackList[0].id).toBe('BF-0001');
    expect(feedbackList[0].type).toBe('COMPLAINT');
    expect(feedbackList[0].status).toBe('SUBMITTED');

    // Verify LoanApplication.grievanceRaised and grievanceNote are set for backwards-compatibility
    const updatedLoan = useStore.getState().loanApplications.find((l) => l.id === loan.id);
    expect(updatedLoan?.grievanceRaised).toBe(true);
    expect(updatedLoan?.grievanceNote).toBe('Inappropriate interest charges applied contrary to zero interest.');
  });

  it('submitting feedback saves rating and does not set grievance on loan', () => {
    const store = useStore.getState();
    const loan = store.submitLoanApplication({
      requestId: 'req-2',
      customerId: 'cust-riya',
      productId: 'prod-ac-1',
      productName: 'Energy Efficient AC',
      principal: 45000,
      tenorMonths: 6,
      tradeInCredit: 0,
      path: 'BUREAU',
    });

    render(
      <BankFeedbackSheet
        isOpen={true}
        customerId="cust-riya"
        loanId={loan.id}
        initialMode="FEEDBACK"
        onClose={() => {}}
      />
    );

    // Star rating is visible
    expect(screen.getByText(/Rate your financing experience/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Describe your query, grievance, or feedback/i);
    fireEvent.change(textarea, { target: { value: 'Very smooth application process and clear zero interest terms.' } });

    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitBtn);

    const feedbackList = useStore.getState().bankFeedback;
    expect(feedbackList.length).toBe(1);
    expect(feedbackList[0].type).toBe('FEEDBACK');
    expect(feedbackList[0].rating).toBe(5);

    const updatedLoan = useStore.getState().loanApplications.find((l) => l.id === loan.id);
    expect(updatedLoan?.grievanceRaised).toBeFalsy();
  });

  it('renders ConfirmDialog and responds to Escape key and confirm action', () => {
    let confirmed = false;
    let cancelled = false;

    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Data"
        message="Are you sure you want to delete your data?"
        confirmLabel="Delete"
        onConfirm={() => {
          confirmed = true;
        }}
        onCancel={() => {
          cancelled = true;
        }}
      />
    );

    expect(screen.getByText('Delete Data')).toBeInTheDocument();

    // Trigger confirm
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirmed).toBe(true);

    // Trigger Esc
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(cancelled).toBe(true);

    rerender(
      <ConfirmDialog
        isOpen={false}
        title="Delete Data"
        message="Are you sure you want to delete your data?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByText('Delete Data')).toBeNull();
  });
});
