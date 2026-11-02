import React, { useState } from 'react';
import { DirectOrder, ApplianceType, City } from '../domain/types';
import { useT, applianceLabel, zoneLabel, cityLabel } from '../i18n';
import { useStore } from '../store/useStore';
import {
  CheckCircle2,
  Copy,
  Check,
  FileDown,
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Package,
} from 'lucide-react';

export function formatOrderReference(orderId: string): string {
  if (!orderId) return 'Order #UC-10482';
  const digits = orderId.replace(/\D/g, '');
  if (digits.length >= 5) {
    return `Order #UC-${digits.slice(-5)}`;
  }
  const hash = Math.abs(
    orderId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 10482)
  );
  return `Order #UC-${String(hash).slice(0, 5)}`;
}

export interface OrderConfirmationProps {
  order: DirectOrder;
  customerName: string;
  city: City;
  zoneId?: string;
  isMobile?: boolean;
  onContinueShopping?: () => void;
  onViewTracker?: () => void;
  onViewKfs?: () => void;
  onClose?: () => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationProps> = ({
  order,
  customerName,
  city,
  zoneId,
  isMobile = false,
  onContinueShopping,
  onViewTracker,
  onViewKfs,
  onClose,
}) => {
  const { t } = useT();
  const zones = useStore((state) => state.zones);
  const [copied, setCopied] = useState<boolean>(false);

  const firstName = customerName ? customerName.split(' ')[0] : 'Customer';
  const orderRef = formatOrderReference(order.id);

  const handleCopy = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(orderRef);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fail silently
    }
  };

  const handleDownloadReceipt = () => {
    try {
      const receiptContent = [
        '========================================',
        '       URBAN COMPANY / UC CLARITY',
        '          ORDER PAYMENT RECEIPT',
        '========================================',
        `${orderRef}`,
        `Date: ${order.createdAt || new Date().toISOString()}`,
        '',
        `Customer: ${customerName}`,
        `Delivery Address: ${zoneLabel(zoneId, zones, t)}, ${cityLabel(city, t)}`,
        `Estimated Delivery: ${order.deliverySlot || 'Tomorrow, 10:00 AM - 1:00 PM'}`,
        '',
        `Item: ${order.productName}`,
        `Brand: ${order.brand}`,
        `Category: ${applianceLabel(order.category, t)}`,
        `Original Price: Rs ${order.price.toLocaleString('en-IN')}`,
        order.tradeInCredit ? `Trade-in Credit: -Rs ${order.tradeInCredit.toLocaleString('en-IN')}` : '',
        `Net Amount Paid: Rs ${order.netAmountPaid.toLocaleString('en-IN')}`,
        `Payment Method: ${order.paymentMethod}`,
        order.monthlyEMI ? `Financing: Rs ${order.monthlyEMI.toLocaleString('en-IN')}/mo for ${order.tenorMonths} months (Aarambh Bank)` : '',
        'Status: CONFIRMED',
        '========================================',
        'Thank you for choosing UC Clarity!',
      ].filter(Boolean).join('\n');

      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt-${orderRef.replace(/[^a-zA-Z0-9_-]/g, '')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }
  };

  const timelineSteps = [
    { id: 'step-1', label: t('order_timeline_confirmed'), active: true, done: true },
    { id: 'step-2', label: t('order_timeline_dispatched'), active: false, done: false },
    { id: 'step-3', label: t('order_timeline_delivered'), active: false, done: false },
    { id: 'step-4', label: t('order_timeline_installed'), active: false, done: false },
  ];

  return (
    <div className="p-5 text-center space-y-4 max-w-lg mx-auto">
      {/* Animated Green Check Icon */}
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner transform transition-transform animate-in zoom-in-75 duration-300">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900">
          {t('order_confirmed_title')}
        </h3>
        <p className="text-xs text-slate-600">
          {t('order_thank_you_param', { firstName })}
        </p>
      </div>

      {/* Reference Card with Copy Button */}
      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div className="text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            {t('order_reference_label')}
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {orderRef}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-purple-700 font-semibold text-xs shadow-2xs transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? t('order_copied') : t('order_copy_ref')}</span>
        </button>
      </div>

      {/* 4-Step Progress Timeline */}
      <div className="py-2 px-1">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-slate-200 -z-0" />
          {timelineSteps.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step.done
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {step.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium ${
                  step.done ? 'text-emerald-800 font-bold' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Product & Delivery Details Card */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
        <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-2">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block leading-snug">
                {order.productName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {order.brand} • {applianceLabel(order.category, t)}
              </span>
            </div>
          </div>
          <span className="font-bold text-slate-900 text-sm shrink-0">
            Rs {order.netAmountPaid.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-500">{t('payment_option_label')}</span>
            <span className="font-semibold text-slate-800">{order.paymentMethod}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">{t('delivery_slot_label')}</span>
            <span className="font-medium text-slate-800">
              {order.deliverySlot || 'Tomorrow, 10:00 AM - 1:00 PM'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">{t('delivery_address_label')}</span>
            <span className="font-medium text-slate-800">
              {zoneLabel(zoneId, zones, t)}, {cityLabel(city, t)}
            </span>
          </div>
        </div>
      </div>

      {/* Trade-in Applied Note */}
      {order.tradeInCredit && order.tradeInCredit > 0 ? (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-left text-[11px] text-emerald-900 flex items-start gap-2">
          <RefreshCw className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span className="leading-snug">
            {t('order_trade_in_applied_note', {
              appliance: applianceLabel(order.category, t),
              amount: order.tradeInCredit.toLocaleString('en-IN'),
            })}
          </span>
        </div>
      ) : null}

      {/* Financing Note */}
      {order.monthlyEMI && order.tenorMonths ? (
        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-left text-[11px] text-purple-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="leading-snug block">
              {t('order_financing_applied_note', {
                emi: order.monthlyEMI.toLocaleString('en-IN'),
                tenor: order.tenorMonths,
              })}
            </span>
            {onViewKfs && (
              <button
                type="button"
                onClick={onViewKfs}
                className="text-purple-700 hover:text-purple-900 font-bold underline text-[11px] block cursor-pointer transition-colors"
              >
                {t('view_kfs_document_link')}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        {isMobile && onViewTracker ? (
          <button
            type="button"
            onClick={onViewTracker}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{t('order_view_tracker_btn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinueShopping || onClose}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{t('continue_shopping_btn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleDownloadReceipt}
          className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('order_download_receipt_btn')}</span>
        </button>
      </div>
    </div>
  );
};
