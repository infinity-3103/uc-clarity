import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { ApplianceType } from '../../domain/types';
import { APPLIANCE_FORMS } from '../../config/appliances';
import { NATIVE_PURIFIERS, NEW_PRICE, SERVICE_FEE, BUYER_FIRST_SERVICE_DISCOUNT_PCT, MARKETPLACE_PRODUCTS } from '../../config/assumptions';
import { ComparisonScreen } from '../../components/ComparisonScreen';
import { ConsentToggles } from '../../components/ConsentToggles';
import { KfsModal } from '../../components/KfsModal';
import { AAConsentModal } from '../../components/AAConsentModal';
import { ApplianceArt } from '../../components/ApplianceArt';
import { SurveyForm } from '../../components/SurveyForm';
import { BankFeedbackSheet } from '../../components/BankFeedbackSheet';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Toast } from '../../components/Toast';
import { SURVEY_DISCOUNT_PCT } from '../../config/assumptions';
import { isSurveyDiscountEligible, getSurveyDiscountAvailableDate, formatSurveyDiscountDate } from '../../domain/leads';
import { useT } from '../../i18n';
import { cityLabel, zoneLabel, applianceLabel, faultLabel, statusLabel, optionLabel } from '../../i18n/formatters';

const NATIVE_CATEGORIES = [
  { id: 'ALL', labelKey: 'cat_all' },
  { id: 'PURIFIER', labelKey: 'cat_purifiers' },
  { id: 'AC', labelKey: 'cat_acs' },
  { id: 'WASHER', labelKey: 'cat_washers' },
  { id: 'FRIDGE', labelKey: 'cat_fridges' },
  { id: 'GEYSER', labelKey: 'cat_geysers' },
] as const;

const PAYMENT_METHODS = [
  { id: 'FULL_UPI', labelKey: 'pay_mode_upi', icon: Zap },
  { id: 'FULL_CARD', labelKey: 'pay_mode_card', icon: CreditCard },
  { id: 'FULL_NETBANKING', labelKey: 'pay_mode_netbanking', icon: Shield },
] as const;
import {
  Wrench,
  Bell,
  Shield,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Trash2,
  Download,
  AlertTriangle,
  ChevronRight,
  Star,
  Truck,
  ArrowLeft,
  Info,
  Calendar,
  CreditCard,
  Zap,
  X,
  MapPin,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react';

export const CustomerApp: React.FC = () => {
  const selectedCustomerId = useStore((state) => state.selectedCustomerId);
  const selectCustomer = useStore((state) => state.selectCustomer);
  const customers = useStore((state) => state.customers);
  const serviceRequests = useStore((state) => state.serviceRequests);
  const professionals = useStore((state) => state.professionals);
  const loanApplications = useStore((state) => state.loanApplications);
  const bankFeedback = useStore((state) => state.bankFeedback);
  const nudges = useStore((state) => state.nudges);
  const bookService = useStore((state) => state.bookService);
  const selectCustomerChoice = useStore((state) => state.selectCustomerChoice);
  const submitLoanApplication = useStore((state) => state.submitLoanApplication);
  const exitLoanCoolingOff = useStore((state) => state.exitLoanCoolingOff);
  const raiseGrievance = useStore((state) => state.raiseGrievance);
  const submitExitSurvey = useStore((state) => state.submitExitSurvey);
  const declineExitSurvey = useStore((state) => state.declineExitSurvey);
  const simulatedDate = useStore((state) => state.simulatedDate);
  const deleteCustomerData = useStore((state) => state.deleteCustomerData);
  const triggerPushNotification = useStore((state) => state.triggerPushNotification);
  const placeDirectOrder = useStore((state) => state.placeDirectOrder);
  const setRole = useStore((state) => state.setRole);
  const selectProfessional = useStore((state) => state.selectProfessional);
  const currentRole = useStore((state) => state.currentRole);

  const { t } = useT();

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Active customer service request (either most recent or specific active one)
  const activeReq = serviceRequests.find((r) => r.customerId === customer.id) || serviceRequests[0];
  const assignedPro = professionals.find((p) => p.id === activeReq?.professionalId);
  const customerLoan = loanApplications.find((l) => l.customerId === customer.id);

  // Subscreen navigation
  const [currentTab, setCurrentTab] = useState<
    'home' | 'book' | 'tracker' | 'marketplace' | 'notifications' | 'consent' | 'exitsurvey'
  >('home');

  // Booking Flow State
  const [bookingAppliance, setBookingAppliance] = useState<ApplianceType>('AC');
  const [surveyStep, setSurveyStep] = useState<number>(0);
  const [bookingAnswers, setBookingAnswers] = useState<Record<string, string | boolean | number>>({});
  const [selectedSlot, setSelectedSlot] = useState<string>('14:00 - 16:00 Today');

  // Loan Flow State
  const [isKfsOpen, setIsKfsOpen] = useState<boolean>(false);
  const [isAAOpen, setIsAAOpen] = useState<boolean>(false);
  const [pendingLoanParams, setPendingLoanParams] = useState<{
    principal: number;
    tenor: number;
    tradeInCredit: number;
    productName: string;
  } | null>(null);

  // In-App Dialog & Bank Feedback State (Issue 2)
  const [isBankFeedbackOpen, setIsBankFeedbackOpen] = useState<boolean>(false);
  const [bankFeedbackMode, setBankFeedbackMode] = useState<'FEEDBACK' | 'COMPLAINT'>('COMPLAINT');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openBankComplaint = () => {
    setBankFeedbackMode('COMPLAINT');
    setIsBankFeedbackOpen(true);
  };

  const openBankFeedback = () => {
    setBankFeedbackMode('FEEDBACK');
    setIsBankFeedbackOpen(true);
  };

  // Top App Mode Switcher: Services vs Native Marketplace
  const [appMode, setAppMode] = useState<'services' | 'native'>('services');
  const [nativeCategory, setNativeCategory] = useState<string>('ALL');
  const [nativeSearch, setNativeSearch] = useState<string>('');

  const filteredNativeProducts = useMemo(() => {
    return MARKETPLACE_PRODUCTS.filter((prod) => {
      const matchCat = nativeCategory === 'ALL' || prod.category === nativeCategory;
      const matchSearch =
        nativeSearch === '' ||
        prod.name.toLowerCase().includes(nativeSearch.toLowerCase()) ||
        prod.brand.toLowerCase().includes(nativeSearch.toLowerCase()) ||
        prod.category.toLowerCase().includes(nativeSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [nativeCategory, nativeSearch]);

  // Full Payment Checkout State
  const [isFullPaymentOpen, setIsFullPaymentOpen] = useState<boolean>(false);
  const [fullPaymentMethod, setFullPaymentMethod] = useState<'FULL_UPI' | 'FULL_CARD' | 'FULL_NETBANKING'>('FULL_UPI');
  const [fullPaymentTradeIn, setFullPaymentTradeIn] = useState<number>(0);
  const [fullPaymentProduct, setFullPaymentProduct] = useState<{
    name: string;
    brand: string;
    price: number;
    category: ApplianceType;
  } | null>(null);

  const handleSelectFullPayment = (tradeInCredit: number) => {
    if (!activeReq) return;
    const price = NEW_PRICE[activeReq.applianceType] || 48500;
    setFullPaymentProduct({
      name: `Energy Efficient ${activeReq.applianceType} (5-Star)`,
      brand: activeReq.brand || 'Standard',
      price,
      category: activeReq.applianceType,
    });
    setFullPaymentTradeIn(tradeInCredit);
    setIsFullPaymentOpen(true);
  };

  const handleConfirmFullPayment = () => {
    if (!fullPaymentProduct) return;

    const netAmountPaid = Math.max(0, fullPaymentProduct.price - fullPaymentTradeIn);

    placeDirectOrder({
      customerId: customer.id,
      productId: `prod-replace-${fullPaymentProduct.category.toLowerCase()}`,
      productName: fullPaymentProduct.name,
      brand: fullPaymentProduct.brand,
      category: fullPaymentProduct.category,
      price: fullPaymentProduct.price,
      tradeInCredit: fullPaymentTradeIn,
      paymentMethod: fullPaymentMethod,
      deliverySlot: 'Tomorrow, 10:00 AM - 1:00 PM',
    });
    if (activeReq) {
      selectCustomerChoice(activeReq.id, 'REPLACE');
    }
    setIsFullPaymentOpen(false);
  };

  // Exit Survey State
  const [exitSurveyResponses, setExitSurveyResponses] = useState<
    { type: ApplianceType; ageBand: string; issue: string }[]
  >([
    { type: 'FRIDGE', ageBand: '6-9 years', issue: 'None / Working fine' },
    { type: 'WASHER', ageBand: '3-5 years', issue: 'Minor vibration' },
  ]);

  // Persona switch handler
  const handleSelectPersona = (id: string) => {
    selectCustomer(id);
    setCurrentTab('home');
  };

  // Start booking for an appliance
  const startBooking = (type: ApplianceType) => {
    setBookingAppliance(type);
    setSurveyStep(0);
    const defaults: Record<string, string | boolean | number> = {};
    APPLIANCE_FORMS[type].customerFields.forEach((f) => {
      if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue;
    });
    setBookingAnswers(defaults);
    setCurrentTab('book');
  };

  const handleFinishBooking = () => {
    bookService({
      customerId: customer.id,
      applianceType: bookingAppliance,
      brand: (bookingAnswers.brand as string) || 'Standard',
      ageYears: Number(bookingAnswers.ageYears) || 5,
      customerAnswers: bookingAnswers,
      scheduledSlot: selectedSlot,
    });
    setCurrentTab('tracker');
  };

  // Handle Replacement choice trigger
  const handleSelectReplace = (tenor: number, tradeInCredit: number) => {
    if (!activeReq) return;
    const principal = NEW_PRICE[activeReq.applianceType];
    const productName = `Energy Efficient ${activeReq.applianceType} (5-Star)`;

    setPendingLoanParams({
      principal,
      tenor,
      tradeInCredit,
      productName,
    });

    if (customer.hasCreditHistory) {
      // Bureau path -> direct to KFS
      setIsKfsOpen(true);
    } else {
      // Thin-file -> Account Aggregator consent required first
      setIsAAOpen(true);
    }
  };

  const handleConfirmLoan = () => {
    if (!activeReq || !pendingLoanParams) return;
    submitLoanApplication({
      requestId: activeReq.id,
      customerId: customer.id,
      productId: 'prod-new-appliance',
      productName: pendingLoanParams.productName,
      principal: pendingLoanParams.principal,
      tenorMonths: pendingLoanParams.tenor,
      tradeInCredit: pendingLoanParams.tradeInCredit,
      path: customer.hasCreditHistory ? 'BUREAU' : 'AA',
    });
    setIsKfsOpen(false);
  };

  // Render Subscreens
  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800">
      {/* Top Customer Header with Location & Two Switcher Buttons */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shrink-0">
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <span>{cityLabel(customer.city, t)}, {t('country_india')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAppMode('services');
                setCurrentTab('notifications');
              }}
              className="relative p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title={t('nav_notifications')}
            >
              <Bell className="w-4 h-4" />
              {nudges.filter((n) => n.customerId === customer.id && !n.opened).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
            <button
              onClick={() => {
                setAppMode('services');
                setCurrentTab('consent');
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title={t('consent_centre')}
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TWO PRIMARY SWITCHER BUTTONS AT TOP */}
        <div className="p-2 bg-slate-950">
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl gap-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAppMode('services');
                if (currentTab === 'marketplace') setCurrentTab('home');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                appMode === 'services'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span className="truncate">{t('services')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAppMode('native');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                appMode === 'native'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">{t('native')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {appMode === 'native' ? (
          /* URBAN COMPANY NATIVE MARKETPLACE SUB-VIEW */
          <div className="p-4 space-y-4">
            {/* Promo Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{t('native_store_title')}</span>
              </div>
              <h3 className="font-extrabold text-base leading-tight">{t('native_store_subtitle')}</h3>
              <p className="text-[11px] text-slate-900 font-medium">
                {t('native_store_desc')}
              </p>
            </div>

            {/* In-app Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={nativeSearch}
                onChange={(e) => setNativeSearch(e.target.value)}
                placeholder={t('search_appliances_placeholder')}
                className="w-full pl-9 pr-3 py-2 bg-white text-slate-800 placeholder-slate-400 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              {nativeSearch && (
                <button
                  onClick={() => setNativeSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {NATIVE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setNativeCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-all ${
                    nativeCategory === c.id
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t(c.labelKey)}
                </button>
              ))}
            </div>

            {/* Products List */}
            <div className="space-y-4">
              {filteredNativeProducts.map((prod) => {
                const discountPct = Math.round(((prod.mrp - prod.price) / prod.mrp) * 100);
                const monthlyEMI = Math.round(prod.price / 12);

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-2 bg-slate-50 relative">
                      <ApplianceArt type={prod.imageType} brand={prod.brand} className="w-full h-36" />
                      {prod.badge && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900 text-amber-300 font-extrabold text-[9px] rounded uppercase tracking-wider shadow">
                          {prod.badge}
                        </span>
                      )}
                      <span className="absolute top-3 right-3 px-1.5 py-0.5 bg-rose-600 text-white font-extrabold text-[9px] rounded shadow">
                        {prod.starRating}★ BEE
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {prod.brand}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                          {prod.name}
                        </h4>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-rose-600 font-bold text-xs">-{discountPct}%</span>
                          <span className="text-base font-black text-slate-900">
                            Rs {prod.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 line-through">
                          Rs {prod.mrp.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="p-1.5 bg-purple-50 rounded-lg text-[10px] text-purple-900 font-medium">
                        {t('no_cost_emi_monthly_param', { amount: monthlyEMI.toLocaleString('en-IN') })}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Truck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{t('free_next_day_delivery_install')}</span>
                      </div>

                      {/* Dual Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setFullPaymentProduct({
                              name: prod.name,
                              brand: prod.brand,
                              price: prod.price,
                              category: prod.category,
                            });
                            setFullPaymentTradeIn(0);
                            setIsFullPaymentOpen(true);
                          }}
                          className="py-2 px-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl font-bold text-[11px] text-center shadow-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{t('pay_in_full_btn')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPendingLoanParams({
                              principal: prod.price,
                              tenor: 12,
                              tradeInCredit: 0,
                              productName: prod.name,
                            });
                            if (customer.hasCreditHistory) {
                              setIsKfsOpen(true);
                            } else {
                              setIsAAOpen(true);
                            }
                          }}
                          className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-[11px] text-center shadow-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{t('buy_on_emi_btn')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* URBAN COMPANY SERVICES SUB-VIEW */
          <>
            {/* TAB 1: HOME */}
            {currentTab === 'home' && (
              <div className="p-4 space-y-5">
                {/* Clean Greeting Card: No personal names or credit scores on app screen */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm space-y-1">
                  <span className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider">
                    {t('uc_home_services_banner')}
                  </span>
                  <h2 className="text-lg font-bold">{t('welcome_home_title')}</h2>
                  <p className="text-xs text-purple-200/90 leading-snug">
                    {t('welcome_home_desc')}
                  </p>
                </div>

            {/* Service Booking Tiles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  {t('book_service_heading')}
                </h3>
                <span className="text-[11px] text-slate-500">{t('fixed_rates_badge')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {(['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'] as ApplianceType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => startBooking(type)}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-purple-500/50 hover:bg-purple-50/30 transition-all text-left flex flex-col justify-between h-20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">
                        {applianceLabel(type, t)}
                      </span>
                      <Wrench className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {t('visit_fee_illustrative', { amount: SERVICE_FEE[type] })}
                    </span>
                  </button>
                ))}

                {/* Marketplace Tile */}
                <button
                  onClick={() => setCurrentTab('marketplace')}
                  className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-xs hover:bg-indigo-100/50 transition-all text-left flex flex-col justify-between h-20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-indigo-950">
                      {t('tile_native_marketplace')}
                    </span>
                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    {t('tile_zero_cost_emi')}
                  </span>
                </button>
              </div>
            </div>

            {/* Active Service Tracker Card (if any) */}
            {activeReq && activeReq.status !== 'CANCELLED' && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    {t('active_request_param', { brand: activeReq.brand, appliance: applianceLabel(activeReq.applianceType, t) })}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                    {statusLabel(activeReq.status, t)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    {t('assigned_pro_name_param', {
                      name: assignedPro?.name || t('assigned_pro_fallback'),
                      rating: assignedPro?.rating || 4.7,
                    })}
                  </p>
                </div>

                <button
                  onClick={() => setCurrentTab('tracker')}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                >
                  <span>{t('track_status_diag_btn')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* My Appliances */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                {t('registered_appliances_heading')}
              </h3>
              <div className="space-y-2">
                {customer.appliances.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-slate-900 block">
                        {app.brand} {applianceLabel(app.type, t)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t('appliance_age_param', { n: app.ageYears })}{' '}
                        {app.noteKey ? `• ${t(app.noteKey, app.noteParams)}` : app.notes ? `• ${app.notes}` : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => startBooking(app.type)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-[11px]"
                    >
                      {t('book_check_action')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOK A REPAIR (Diagnostic Survey + Consents) */}
        {currentTab === 'book' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('home')}
                className="p-1 rounded text-slate-500 hover:bg-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-sm text-slate-900">
                {t('book_appliance_repair', { appliance: applianceLabel(bookingAppliance, t) })}
              </h3>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all"
                style={{
                  width: `${((surveyStep + 1) / (APPLIANCE_FORMS[bookingAppliance].customerFields.length + 2)) * 100}%`,
                }}
              />
            </div>

            {/* Step 1: Diagnostic Questions with "Why we ask" (FR1) */}
            {surveyStep < APPLIANCE_FORMS[bookingAppliance].customerFields.length ? (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                {(() => {
                  const field = APPLIANCE_FORMS[bookingAppliance].customerFields[surveyStep];
                  return (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                          {t('question_progress_param', {
                            n: surveyStep + 1,
                            total: APPLIANCE_FORMS[bookingAppliance].customerFields.length,
                          })}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                          {t(field.label)}
                        </h4>
                        {field.whyWeAsk && (
                          <div className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <Info className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>{t('why_we_ask_prefix')}</strong> {field.whyWeAsk}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Input based on type */}
                      {field.type === 'select' && (
                        <div className="grid grid-cols-2 gap-2">
                          {field.options?.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setBookingAnswers({ ...bookingAnswers, [field.key]: opt });
                                setSurveyStep(surveyStep + 1);
                              }}
                              className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                                bookingAnswers[field.key] === opt
                                  ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {optionLabel(opt, t)}
                            </button>
                          ))}
                        </div>
                      )}

                      {field.type === 'boolean' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBookingAnswers({ ...bookingAnswers, [field.key]: true });
                              setSurveyStep(surveyStep + 1);
                            }}
                            className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                              bookingAnswers[field.key] === true
                                ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {t('ans_yes')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBookingAnswers({ ...bookingAnswers, [field.key]: false });
                              setSurveyStep(surveyStep + 1);
                            }}
                            className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                              bookingAnswers[field.key] === false
                                ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {t('ans_no_not_sure')}
                          </button>
                        </div>
                      )}

                      {field.type === 'number' && (
                        <div className="space-y-2">
                          <input
                            type="number"
                            value={Number(bookingAnswers[field.key]) || ''}
                            onChange={(e) =>
                              setBookingAnswers({ ...bookingAnswers, [field.key]: Number(e.target.value) })
                            }
                            placeholder={field.placeholder || t('enter_value_placeholder')}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setSurveyStep(surveyStep + 1)}
                            className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-medium"
                          >
                            {t('next_question_btn')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Visible "Skip questions and just book" Option (FR1 & Section 10) */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setSurveyStep(APPLIANCE_FORMS[bookingAppliance].customerFields.length)}
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold underline underline-offset-2"
                  >
                    {t('skip_and_book_btn')}
                  </button>
                  {surveyStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setSurveyStep(surveyStep - 1)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      {t('btn_previous')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Consent Toggles & Slot Confirmation */
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                  {t('select_slot_confirm_title')}
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">{t('preferred_visit_window')}</label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="14:00 - 16:00 Today">{t('slot_14_16_today')}</option>
                    <option value="16:00 - 18:00 Today">{t('slot_16_18_today')}</option>
                    <option value="10:00 - 12:00 Tomorrow">{t('slot_10_12_tomorrow')}</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between">
                  <span className="text-slate-600">{t('inspection_service_fee_label')}</span>
                  <span className="font-bold text-slate-900">
                    {t('visit_fee_illustrative', { amount: SERVICE_FEE[bookingAppliance] })}
                  </span>
                </div>

                {/* Consent Toggles: Defaults OFF (Guardrail G7) */}
                <ConsentToggles customerId={customer.id} />

                <button
                  type="button"
                  onClick={handleFinishBooking}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  {t('confirm_booking_rs', { amount: SERVICE_FEE[bookingAppliance] })}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VISIT TRACKER & COMPARISON SCREEN */}
        {currentTab === 'tracker' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('home')}
                className="p-1 rounded text-slate-500 hover:bg-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-sm text-slate-900">{t('live_service_tracker')}</h3>
            </div>

            {activeReq ? (
              <div className="space-y-4">
                {/* Status Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                        {t('job_status_title')}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {statusLabel(activeReq.status, t)}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500">{activeReq.scheduledSlot}</span>
                  </div>

                  {/* Technician Profile Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {assignedPro?.name || t('assigned_technician_title')}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {t('certified_specialist_param', { appliance: applianceLabel(activeReq.applianceType, t) })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{assignedPro?.rating || 4.7}</span>
                      </div>
                    </div>
                  </div>

                  {/* Service Fee & Post-Booking Survey Discount Offer (Issue 1) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">{t('inspection_service_fee_label')}</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">
                          Rs {activeReq.serviceFee.toLocaleString('en-IN')}
                        </span>
                        {activeReq.discountApplied && activeReq.discountApplied > 0 ? (
                          <span className="block text-[11px] text-emerald-600 font-semibold">
                            -{activeReq.discountApplied} ({t('survey_discount_applied')})
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {!activeReq.exitSurvey && !activeReq.surveyDeclined && (
                      <>
                        {isSurveyDiscountEligible(customer, simulatedDate) ? (
                          <div className="mt-2 p-2.5 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
                            <div className="flex items-start gap-2">
                              <Tag className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-purple-950 block">
                                  {t('survey_offer_card_title')}
                                </span>
                                <span className="text-[11px] text-purple-800 leading-tight block">
                                  {t('survey_offer_card_desc')}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setCurrentTab('exitsurvey')}
                                className="flex-1 py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer text-center"
                              >
                                {t('take_survey_btn')}
                              </button>
                              <button
                                type="button"
                                onClick={() => declineExitSurvey(activeReq.id)}
                                className="py-1.5 px-2.5 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-lg border border-slate-200 bg-white cursor-pointer"
                              >
                                {t('skip_survey_btn')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          customer.lastSurveyDiscountAt && (
                            <div className="mt-2 text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                              {t('survey_discount_cooldown_notice', {
                                date: formatSurveyDiscountDate(getSurveyDiscountAvailableDate(customer)!)
                              })}
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* When inspection is submitted: Comparison Screen appears (Section 8) */}
                {activeReq.recommendation && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <ComparisonScreen
                      recommendation={activeReq.recommendation}
                      applianceType={activeReq.applianceType}
                      brand={activeReq.brand}
                      ageYears={activeReq.ageYears}
                      likelyFault={(activeReq.proReadings?.likelyFault as string) || t('likely_fault_fallback')}
                      onSelectRepair={() => {
                        selectCustomerChoice(activeReq.id, 'REPAIR');
                        setCurrentTab('exitsurvey');
                      }}
                      onSelectReplace={(tenor, tradeInCredit) => handleSelectReplace(tenor, tradeInCredit)}
                      onSelectFullPayment={(tradeInCredit) => handleSelectFullPayment(tradeInCredit)}
                      onSelectDecideLater={() => {
                        selectCustomerChoice(activeReq.id, 'DEFER');
                        setCurrentTab('home');
                      }}
                    />
                  </div>
                )}

                {/* Loan Status & Cooling-off view */}
                {customerLoan && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{t('aarambh_financing_status')}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          customerLoan.decision === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : customerLoan.decision === 'MANUAL_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {statusLabel(customerLoan.decision, t)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>{t('financed_item_label')}</span>
                        <span className="font-medium text-slate-900">{customerLoan.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('principal_tenor_param', { amount: customerLoan.principal.toLocaleString('en-IN'), tenor: customerLoan.tenorMonths })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{t('zero_cost_emi_param', { amount: customerLoan.monthlyEMI.toLocaleString('en-IN') })}</span>
                      </div>
                    </div>

                    {/* Cooling-off Notice & Exit Action */}
                    {customerLoan.status === 'COOLING_OFF' && !customerLoan.coolingOffExited && (
                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1.5">
                        <span className="font-semibold block">{t('cooling_off_active_title')}</span>
                        <p className="text-[11px] leading-tight">
                          {t('cooling_off_active_desc')}
                        </p>
                        <button
                          type="button"
                          onClick={() => exitLoanCoolingOff(customerLoan.id)}
                          className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded font-semibold text-[11px]"
                        >
                          {t('exit_loan_cooling_off_btn')}
                        </button>
                      </div>
                    )}

                    {customerLoan.coolingOffExited && (
                      <div className="p-2 bg-slate-100 rounded text-slate-600 italic text-[11px]">
                        {t('loan_cancelled_cooling_off')}
                      </div>
                    )}

                    {/* Trade-in Pickup Tracker */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-purple-600" />
                        {t('old_unit_pickup_label')}
                      </span>
                      <span className="font-medium text-emerald-700">{t('scheduled_badge')}</span>
                    </div>

                    {/* Grievance & Feedback Actions (Issue 2) */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={openBankComplaint}
                          className="text-purple-700 font-semibold underline cursor-pointer"
                        >
                          {t('raise_grievance_btn')}
                        </button>
                        {customerLoan.grievanceRaised && (
                          <span className="text-amber-700 font-medium">{t('grievance_submitted_badge')}</span>
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={openBankFeedback}
                          className="text-purple-700 hover:text-purple-900 underline cursor-pointer"
                        >
                          {t('give_bank_feedback_link')}
                        </button>
                      </div>
                    </div>

                    {/* Submitted Bank Tickets List */}
                    {bankFeedback.filter((fb) => fb.customerId === customer.id).length > 0 && (
                      <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider block">
                          {t('tickets_header')}
                        </span>
                        <div className="space-y-1">
                          {bankFeedback
                            .filter((fb) => fb.customerId === customer.id)
                            .map((ticket) => (
                              <div
                                key={ticket.id}
                                className="p-1.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center text-[10px]"
                              >
                                <div>
                                  <span className="font-mono font-bold text-purple-900 block">
                                    {ticket.id} ({ticket.type === 'COMPLAINT' ? t('ticket_type_complaint') : t('ticket_type_feedback')})
                                  </span>
                                  <span className="text-slate-500 line-clamp-1">{ticket.message}</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[9px]">
                                  {statusLabel(ticket.status, t)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                {t('no_active_bookings')}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MARKETPLACE */}
        {currentTab === 'marketplace' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('home')}
                  className="p-1 rounded text-slate-500 hover:bg-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-sm text-slate-900">{t('uc_store_title')}</h3>
              </div>
              <button
                onClick={() => setRole('marketplace')}
                className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1"
              >
                <span>{t('full_store_btn')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-xl text-xs space-y-1">
              <span className="font-bold block text-amber-300">{t('direct_mfg_title')}</span>
              <p className="text-[11px] text-slate-200">
                {t('direct_mfg_desc')}
              </p>
            </div>

            <div className="space-y-3">
              {NATIVE_PURIFIERS.map((item, idx) => (
                <div
                  key={item.name}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-medium">
                            {t('badge_best_seller')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-600 block mt-0.5">
                        Rs {item.price.toLocaleString('en-IN')} {t('or_emi_monthly_param', { amount: Math.round(item.price / 9).toLocaleString('en-IN') })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setFullPaymentProduct({
                          name: item.name,
                          brand: 'Urban Company Native',
                          price: item.price,
                          category: 'PURIFIER',
                        });
                        setFullPaymentTradeIn(0);
                        setIsFullPaymentOpen(true);
                      }}
                      className="py-1.5 px-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg font-bold text-[11px] text-center"
                    >
                      {t('pay_in_full_upi')}
                    </button>

                    <button
                      onClick={() => {
                        setPendingLoanParams({
                          principal: item.price,
                          tenor: 9,
                          tradeInCredit: 0,
                          productName: item.name,
                        });
                        if (customer.hasCreditHistory) {
                          setIsKfsOpen(true);
                        } else {
                          setIsAAOpen(true);
                        }
                      }}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-[11px] text-center"
                    >
                      {t('buy_with_emi_btn')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setRole('marketplace')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-purple-800 font-bold rounded-xl text-xs text-center border border-purple-200 flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('browse_all_appliances_btn')}</span>
            </button>
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS (Marketing Nudges) */}
        {currentTab === 'notifications' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('home')}
                className="p-1 rounded text-slate-500 hover:bg-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-sm text-slate-900">{t('notifications_alerts_title')}</h3>
            </div>

            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200/60 text-[11px] text-purple-900">
              <strong>{t('cap_policy_prefix')}</strong> {t('cap_policy_desc')}
            </div>

            <button
              type="button"
              onClick={() => {
                triggerPushNotification({
                  title: t('nudge_pre_summer_title'),
                  body: t('nudge_pre_summer_body'),
                  appTitle: 'URBAN COMPANY',
                });
              }}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t('simulate_push_btn')}</span>
            </button>

            <div className="space-y-2.5">
              {nudges.filter((n) => n.customerId === customer.id).length > 0 ? (
                nudges
                  .filter((n) => n.customerId === customer.id)
                  .map((n) => (
                    <div
                      key={n.id}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.sentAt}</span>
                      </div>
                      <p className="text-slate-600 leading-snug">{n.body}</p>
                    </div>
                  ))
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  {t('no_notifications_msg')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: CONSENT CENTRE & ONE-CLICK DELETE (Section 10) */}
        {currentTab === 'consent' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('home')}
                className="p-1 rounded text-slate-500 hover:bg-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-sm text-slate-900">{t('consent_privacy_centre_title')}</h3>
            </div>

            {/* Purpose Toggles */}
            <ConsentToggles customerId={customer.id} />

            {/* What we hold about you */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                {t('data_held_title')}
              </h4>
              <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
                <li>{t('customer_profile_data_param', { name: customer.name, phone: customer.phone, city: cityLabel(customer.city, t) })}</li>
                <li>{t('appliance_records_param', { count: customer.appliances.length })}</li>
                <li>{t('inspection_diagnostic_histories')}</li>
                <li>{t('consent_event_audit_ledger')}</li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customer, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `${customer.name}-data-export.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('download_my_data_btn')}</span>
                </button>
              </div>
            </div>

            {/* Red "Delete my data" One-Click Action (FR8 & Section 10) */}
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-900 font-bold">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>{t('right_to_be_forgotten_title')}</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                {t('right_to_be_forgotten_desc')}{' '}
                {t('retained_for_legal_reasons_prefix')}
                <strong>{t('retained_for_legal_reasons_text')}</strong>
                {t('retained_for_legal_reasons_suffix')}
              </p>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
              >
                {t('delete_my_data_btn')}
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: EXIT SURVEY OFFER (FR7 & Step 9) */}
        {currentTab === 'exitsurvey' && (
          <div className="p-4 space-y-4">
            <SurveyForm
              customerId={customer.id}
              city={customer.city}
              zoneId={customer.zoneId}
              source="exit"
              title={t('exit_survey_title')}
              description={t('exit_survey_desc')}
              onComplete={(answers) => {
                if (activeReq) {
                  submitExitSurvey(activeReq.id, answers);
                }
                setCurrentTab('tracker');
              }}
              onCancel={() => {
                if (activeReq) {
                  declineExitSurvey(activeReq.id);
                }
                setCurrentTab('tracker');
              }}
            />
          </div>
        )}
        </>
      )}
      </div>

      {/* Modals */}
      {pendingLoanParams && (
        <>
          <KfsModal
            productName={pendingLoanParams.productName}
            principal={pendingLoanParams.principal}
            tenorMonths={pendingLoanParams.tenor}
            monthlyEMI={Math.round((pendingLoanParams.principal - pendingLoanParams.tradeInCredit) / pendingLoanParams.tenor)}
            isOpen={isKfsOpen}
            onClose={() => setIsKfsOpen(false)}
            onConfirm={handleConfirmLoan}
          />

          <AAConsentModal
            customerId={customer.id}
            isOpen={isAAOpen}
            onClose={() => setIsAAOpen(false)}
            onConsentSuccess={() => {
              setIsAAOpen(false);
              setIsKfsOpen(true);
            }}
            onDeclineToRepair={() => {
              setIsAAOpen(false);
              if (activeReq) selectCustomerChoice(activeReq.id, 'REPAIR');
              setCurrentTab('tracker');
            }}
          />
        </>
      )}

      {/* Instant Full Payment Checkout Modal */}
      {isFullPaymentOpen && fullPaymentProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-4 border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{t('one_time_full_payment_title')}</h4>
                <p className="text-[10px] text-purple-600 font-medium">{t('uc_direct_checkout_subtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullPaymentOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block">{fullPaymentProduct.name}</span>
              <div className="flex justify-between text-slate-500">
                <span>{t('original_price_label')}</span>
                <span>Rs {fullPaymentProduct.price.toLocaleString('en-IN')}</span>
              </div>
              {fullPaymentTradeIn > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>{t('old_unit_trade_in_label')}</span>
                  <span>-Rs {fullPaymentTradeIn.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                <span>{t('total_amount_label')}</span>
                <span>
                  Rs {Math.max(
                    0,
                    fullPaymentProduct.price - fullPaymentTradeIn
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">{t('select_payment_mode_label')}</label>
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFullPaymentMethod(m.id as any)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      fullPaymentMethod === m.id
                        ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-purple-600" />
                      <span>{t(m.labelKey)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
              <Truck className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{t('complimentary_delivery_unboxing')}</span>
            </div>

            <button
              type="button"
              onClick={handleConfirmFullPayment}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {t('pay_rs_confirm_btn', {
                amount: Math.max(
                  0,
                  fullPaymentProduct.price - fullPaymentTradeIn
                ).toLocaleString('en-IN'),
              })}
            </button>
          </div>
        </div>
      )}

      {/* Delete Data Confirmation Dialog (Issue 2) */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={t('right_to_be_forgotten_title')}
        message={t('delete_confirm_prompt')}
        confirmLabel={t('delete_my_data_btn')}
        onConfirm={() => {
          deleteCustomerData(customer.id);
          setIsDeleteConfirmOpen(false);
          setToastMessage(t('delete_success_alert'));
        }}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      {/* Aarambh Bank Feedback & Grievance Bottom Sheet (Issue 2) */}
      <BankFeedbackSheet
        isOpen={isBankFeedbackOpen}
        customerId={customer.id}
        loanId={customerLoan?.id}
        initialMode={bankFeedbackMode}
        onClose={() => setIsBankFeedbackOpen(false)}
      />

      {/* In-App Toast Notices (Issue 2) */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
