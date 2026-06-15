import { useContext } from 'react';
import { WalletContext, type WalletContextValue } from '../context/WalletContext';

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet debe usarse dentro de <WalletProvider>');
  }
  return ctx;
}
