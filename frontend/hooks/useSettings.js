import { useMemo } from 'react';
import { useGetSettings } from '@/features/settings.api';

/**
 * useSettings Hook
 * Provides system-wide settings with convenient helpers for logos, 
 * currency, and formatting.
 */
export const useSettings = () => {
  const { data: settings, isLoading, isError, refetch } = useGetSettings();

  const logoUrl = useMemo(() => {
    if (!settings?.logo) return null;
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/${settings.logo}`;
  }, [settings?.logo]);

  const companyName = useMemo(() => settings?.companyName || 'Supermarket POS', [settings?.companyName]);
  
  const currency = useMemo(() => ({
    code: settings?.currency || 'USD',
    symbol: settings?.currencySymbol || '$'
  }), [settings?.currency, settings?.currencySymbol]);

  const tax = useMemo(() => ({
    percentage: settings?.taxPercentage || 0,
    name: settings?.taxName || 'VAT'
  }), [settings?.taxPercentage, settings?.taxName]);

  const formatCurrency = useMemo(() => (amount) => {
    const value = parseFloat(amount) || 0;
    return `${currency.symbol}${value.toFixed(2)}`;
  }, [currency.symbol]);

  return {
    settings,
    companyName,
    logoUrl,
    currency,
    tax,
    formatCurrency,
    isLoading,
    isError,
    refetch
  };
};
