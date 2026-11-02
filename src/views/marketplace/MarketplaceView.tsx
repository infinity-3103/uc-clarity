import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { MARKETPLACE_PRODUCTS } from '../../config/assumptions';
import { MarketplaceProduct, ApplianceType } from '../../domain/types';
import { ApplianceArt } from '../../components/ApplianceArt';
import { useT, cityLabel } from '../../i18n';
import {
  Search,
  Star,
  Truck,
  ShieldCheck,
  Check,
  CreditCard,
  Zap,
  ArrowRight,
  X,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', labelKey: 'cat_all_appliances' },
  { id: 'AC', labelKey: 'cat_air_conditioners' },
  { id: 'FRIDGE', labelKey: 'cat_refrigerators' },
  { id: 'WASHER', labelKey: 'cat_washing_machines' },
  { id: 'PURIFIER', labelKey: 'cat_water_purifiers' },
  { id: 'GEYSER', labelKey: 'cat_water_geysers' },
] as const;

const PAYMENT_METHODS = [
  { id: 'FULL_UPI', labelKey: 'pay_method_upi', icon: Zap },
  { id: 'FULL_CARD', labelKey: 'pay_method_card', icon: CreditCard },
  { id: 'FULL_NETBANKING', labelKey: 'pay_method_netbanking', icon: ShieldCheck },
] as const;

export const MarketplaceView: React.FC = () => {
  const { t } = useT();
  const customers = useStore((state) => state.customers);
  const selectedCustomerId = useStore((state) => state.selectedCustomerId);
  const selectCustomer = useStore((state) => state.selectCustomer);
  const simulatedCity = useStore((state) => state.simulatedCity);
  const placeDirectOrder = useStore((state) => state.placeDirectOrder);
  const directOrders = useStore((state) => state.directOrders);

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStarRating, setSelectedStarRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING'>('FEATURED');

  // Checkout Modal State
  const [checkoutProduct, setCheckoutProduct] = useState<MarketplaceProduct | null>(null);
  const [checkoutType, setCheckoutType] = useState<'FULL' | 'EMI'>('FULL');
  const [fullPaymentMethod, setFullPaymentMethod] = useState<'FULL_UPI' | 'FULL_CARD' | 'FULL_NETBANKING'>('FULL_UPI');
  const [selectedTenor, setSelectedTenor] = useState<number>(12);
  const [applyTradeIn, setApplyTradeIn] = useState<boolean>(true);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return MARKETPLACE_PRODUCTS.filter((prod) => {
      const matchCat = selectedCategory === 'ALL' || prod.category === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStars = selectedStarRating === null || prod.starRating >= selectedStarRating;
      return matchCat && matchSearch && matchStars;
    }).sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.price - b.price;
      if (sortBy === 'PRICE_DESC') return b.price - a.price;
      if (sortBy === 'RATING') return b.rating - a.rating;
      return 0; // FEATURED
    });
  }, [searchQuery, selectedCategory, selectedStarRating, sortBy]);

  // Handle open checkout
  const handleOpenCheckout = (product: MarketplaceProduct, type: 'FULL' | 'EMI') => {
    setCheckoutProduct(product);
    setCheckoutType(type);
    setCompletedOrder(null);
  };

  // Execute purchase
  const handleExecuteOrder = () => {
    if (!checkoutProduct) return;

    const tradeInDiscount = applyTradeIn ? 3000 : 0;
    const finalPrice = Math.max(0, checkoutProduct.price - tradeInDiscount);
    const monthlyEMI = Math.round(finalPrice / selectedTenor);

    const order = placeDirectOrder({
      customerId: customer.id,
      productId: checkoutProduct.id,
      productName: checkoutProduct.name,
      brand: checkoutProduct.brand,
      category: checkoutProduct.category,
      price: checkoutProduct.price,
      tradeInCredit: tradeInDiscount,
      paymentMethod: checkoutType === 'FULL' ? fullPaymentMethod : 'NO_COST_EMI',
      tenorMonths: checkoutType === 'EMI' ? selectedTenor : undefined,
      monthlyEMI: checkoutType === 'EMI' ? monthlyEMI : undefined,
      deliverySlot: 'Tomorrow, 10:00 AM - 1:00 PM',
    });

    setCompletedOrder(order);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Amazon-style Marketplace Top Banner */}
      <header className="bg-slate-900 text-white sticky top-16 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Delivering To */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {t('appliance_store_title')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {t('direct_marketplace')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {t('deliver_to_param', { name: customer.name, city: cityLabel(simulatedCity, t) })}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_marketplace_placeholder')}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 text-white placeholder-slate-400 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Customer Persona & Orders count */}
          <div className="flex items-center gap-3">
            <select
              value={customer.id}
              onChange={(e) => selectCustomer(e.target.value)}
              className="bg-slate-800 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {t('shopping_as_param', { name: c.name })}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('orders_count_param', { count: directOrders.length })}</span>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="bg-slate-800/90 border-t border-slate-700/80 px-4 sm:px-6 py-2 overflow-x-auto flex items-center gap-2 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </header>

      {/* Main Store Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Promotional Hero Strip */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                {t('uc_direct_guaranteed')}
              </span>
              <span className="text-xs text-amber-300 font-medium">{t('no_cost_emi_aarambh')}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              {t('hero_upgrade_title')}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('hero_upgrade_desc')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 z-10">
            <div className="p-3 bg-white/10 backdrop-blur rounded-xl border border-white/20 text-center">
              <span className="text-lg font-bold text-amber-400 block">0%</span>
              <span className="text-[10px] text-slate-200">{t('interest_on_emi')}</span>
            </div>
            <div className="p-3 bg-white/10 backdrop-blur rounded-xl border border-white/20 text-center">
              <span className="text-lg font-bold text-amber-400 block">{t('installation_24hr')}</span>
              <span className="text-[10px] text-slate-200">{t('free_installation_badge')}</span>
            </div>
            <div className="p-3 bg-white/10 backdrop-blur rounded-xl border border-white/20 text-center">
              <span className="text-lg font-bold text-amber-400 block">100%</span>
              <span className="text-[10px] text-slate-200">{t('genuine_warranty')}</span>
            </div>
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              {t('showing_appliances_param', { count: filteredProducts.length })}
            </span>
            {selectedStarRating && (
              <button
                type="button"
                onClick={() => setSelectedStarRating(null)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] flex items-center gap-1"
              >
                <span>{t('stars_above_param', { stars: selectedStarRating })}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Star Rating Filters */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">{t('bee_rating_filter')}</span>
              {[5, 4, 3].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() =>
                    setSelectedStarRating(selectedStarRating === stars ? null : stars)
                  }
                  className={`px-2 py-0.5 rounded border text-[11px] font-semibold transition-all ${
                    selectedStarRating === stars
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {stars}★
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">{t('sort_by_label')}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 focus:outline-none"
              >
                <option value="FEATURED">{t('sort_featured')}</option>
                <option value="PRICE_ASC">{t('sort_price_asc')}</option>
                <option value="PRICE_DESC">{t('sort_price_desc')}</option>
                <option value="RATING">{t('sort_rating')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);
            const monthlyEMI = Math.round(product.price / 12);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Appliance Art Illustration */}
                  <div className="relative p-2 bg-slate-50">
                    <ApplianceArt type={product.imageType} brand={product.brand} />

                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-4 left-4 px-2 py-0.5 bg-slate-900 text-amber-300 font-extrabold text-[10px] rounded shadow uppercase tracking-wider">
                        {t(product.badge, undefined, product.badge)}
                      </span>
                    )}

                    {/* Energy Star Badge */}
                    <span className="absolute top-4 right-4 px-2 py-0.5 bg-rose-600 text-white font-extrabold text-[10px] rounded shadow">
                      {t('bee_rating_param', { stars: product.starRating })}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 space-y-3">
                    {/* Brand & Name */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {product.brand}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-purple-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-700 text-white font-bold text-[11px]">
                        <span>{product.rating}</span>
                        <Star className="w-3 h-3 fill-white" />
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        {t('ratings_count_param', { count: product.reviewCount.toLocaleString('en-IN') })}
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-rose-600 font-bold text-base">
                          {t('off_pct_param', { pct: discountPct })}
                        </span>
                        <span className="text-xl font-black text-slate-900">
                          Rs {product.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>M.R.P.:</span>
                        <span className="line-through">Rs {product.mrp.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* No-cost EMI highlight */}
                    <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-xs text-purple-900">
                      {t('no_cost_emi_from_param', { amount: monthlyEMI.toLocaleString('en-IN') })}
                    </div>

                    {/* Delivery & Warranty info */}
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('free_delivery_tomorrow')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>{product.warranty ? t(product.warranty, undefined, product.warranty) : ''}</span>
                      </div>
                    </div>

                    {/* Feature Highlights */}
                    <ul className="space-y-1 pt-1 border-t border-slate-100 text-[11px] text-slate-600">
                      {product.highlights.slice(0, 2).map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{t(h)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Purchase Action Triggers (Dual: Full Payment vs No-Cost EMI) */}
                <div className="p-4 pt-0 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCheckout(product, 'FULL')}
                    className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{t('buy_now_full_btn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenCheckout(product, 'EMI')}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('pay_with_emi_btn')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Checkout Drawer / Modal */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col text-slate-800">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-sm">
                  {checkoutType === 'FULL' ? t('instant_full_checkout') : t('aarambh_emi_checkout')}
                </h3>
                <p className="text-[11px] text-amber-300">{t('prototype_watermark')}</p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutProduct(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {completedOrder ? (
              /* Order Success Screen */
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900">{t('order_confirmed_title')}</h4>
                  <p className="text-xs text-slate-600">
                    {t('order_placed_desc', { product: completedOrder.productName })}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('order_reference_label')}</span>
                    <span className="font-mono font-bold text-slate-900">{completedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('payment_option_label')}</span>
                    <span className="font-semibold text-slate-900">{completedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('amount_paid_label')}</span>
                    <span className="font-bold text-slate-900">
                      Rs {completedOrder.finalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {completedOrder.monthlyEMI && (
                    <div className="flex justify-between text-purple-700 font-semibold">
                      <span>{t('monthly_installment')}</span>
                      <span>
                        {t('monthly_installment_param', {
                          amount: completedOrder.monthlyEMI.toLocaleString('en-IN'),
                          tenor: completedOrder.tenorMonths,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-500">{t('delivery_slot_label')}</span>
                    <span className="font-medium text-slate-800">{completedOrder.deliverySlot}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutProduct(null)}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {t('continue_shopping_btn')}
                </button>
              </div>
            ) : (
              /* Active Checkout Form */
              <div className="p-5 space-y-5 text-xs">
                {/* Product Summary Row */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-16 h-16 shrink-0 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center">
                    <ApplianceArt type={checkoutProduct.imageType} className="w-full h-full" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{checkoutProduct.brand}</span>
                    <h4 className="font-bold text-slate-900 leading-snug line-clamp-1">{checkoutProduct.name}</h4>
                    <div className="text-sm font-black text-slate-900">
                      Rs {checkoutProduct.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900">{t('delivery_address_title')}</span>
                    <span className="text-purple-600 font-semibold text-[11px]">{t('free_next_day_badge')}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {t('address_zone_param', {
                      name: customer.name,
                      zone: customer.zoneId.split('-').pop() || '',
                      city: cityLabel(simulatedCity, t),
                    })}
                  </p>
                </div>

                {/* Optional Trade-In / Old Appliance Exchange */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyTradeIn}
                      onChange={(e) => setApplyTradeIn(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-emerald-950 block">
                        {t('trade_in_exchange_title')}
                      </span>
                      <span className="text-[11px] text-emerald-800 leading-tight block">
                        {t('trade_in_exchange_desc')}
                      </span>
                    </div>
                  </label>
                </div>

                {/* FULL PAYMENT OPTIONS */}
                {checkoutType === 'FULL' && (
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-800 block">{t('choose_payment_method')}</label>
                    <div className="space-y-1.5">
                      {PAYMENT_METHODS.map((m) => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setFullPaymentMethod(m.id as any)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                              fullPaymentMethod === m.id
                                ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-amber-600" />
                              <span>{t(m.labelKey)}</span>
                            </div>
                            {fullPaymentMethod === m.id && <Check className="w-4 h-4 text-amber-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* NO COST EMI OPTIONS */}
                {checkoutType === 'EMI' && (
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-800 block">
                      {t('choose_emi_tenor')}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 6, 9, 12].map((tenor) => {
                        const netPrice = applyTradeIn
                          ? Math.max(0, checkoutProduct.price - 3000)
                          : checkoutProduct.price;
                        const emi = Math.round(netPrice / tenor);
                        return (
                          <button
                            key={tenor}
                            type="button"
                            onClick={() => setSelectedTenor(tenor)}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              selectedTenor === tenor
                                ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="block text-xs font-bold">{t('tenor_months_param', { tenor })}</span>
                            <span className="block text-[10px] text-purple-700 font-semibold mt-0.5">
                              {t('per_month_param', { amount: emi.toLocaleString('en-IN') })}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                      <div className="font-medium text-slate-800">
                        {t('zero_interest_note')}
                      </div>
                      <div>{t('subvention_note')}</div>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="border-t border-slate-100 pt-3 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>{t('retail_price_label')}</span>
                    <span>Rs {checkoutProduct.price.toLocaleString('en-IN')}</span>
                  </div>
                  {applyTradeIn && (
                    <div className="flex justify-between text-emerald-700">
                      <span>{t('old_appliance_trade_in_label')}</span>
                      <span>-Rs 3,000</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>{t('delivery_installation_label')}</span>
                    <span className="font-semibold text-emerald-600">{t('free_badge')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                    <span>{t('total_net_payable_label')}</span>
                    <span>
                      Rs {Math.max(
                        0,
                        applyTradeIn ? Math.max(0, checkoutProduct.price - 3000) : checkoutProduct.price
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Final Confirm Button */}
                <button
                  type="button"
                  onClick={handleExecuteOrder}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {t('confirm_place_order_param', {
                      amount: Math.max(
                        0,
                        applyTradeIn ? Math.max(0, checkoutProduct.price - 3000) : checkoutProduct.price
                      ).toLocaleString('en-IN'),
                    })}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
