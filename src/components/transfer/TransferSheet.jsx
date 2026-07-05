// src/components/transfer/TransferSheet.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ArrowDown, Check, ChevronDown } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function TransferSheet({ open, onClose }) {
  const { balanceGBP, balanceNGN, transferBetweenAccounts } = useFinance();
  const { exchangeRate } = useCurrency();

  const [fromAccount, setFromAccount] = useState('GBP');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const toAccount = fromAccount === 'GBP' ? 'NGN' : 'GBP';
  const fromBalance = fromAccount === 'GBP' ? balanceGBP : balanceNGN;
  const fromSymbol = fromAccount === 'GBP' ? '£' : '₦';
  const toSymbol = toAccount === 'GBP' ? '£' : '₦';

  const convertedAmount = amount && exchangeRate
    ? fromAccount === 'GBP'
      ? Math.round(parseFloat(amount) * exchangeRate)
      : parseFloat(amount) / exchangeRate
    : 0;

  const wouldOverdraw = amount && parseFloat(amount) > fromBalance;

  const y = useMotionValue(0);
  const bgOpacity = useTransform(y, [0, 300], [1, 0]);

  useEffect(() => {
    if (!open) { setAmount(''); setNotes(''); y.set(0); }
  }, [open]);

  const handleTransfer = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      const success = await transferBetweenAccounts({
        fromAccount,
        toAccount,
        fromAmount: parseFloat(amount),
        toAmount: fromAccount === 'GBP' ? convertedAmount : parseFloat(convertedAmount.toFixed(2)),
        notes,
        date: new Date(),
        exchangeRate,
      });
      if (success) onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose();
    else y.set(0);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ opacity: bgOpacity }} onClick={onClose} />
          <motion.div className="sheet-panel" style={{ y }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.8 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', cursor: 'grab' }} />
            </div>

            <div style={{ padding: '14px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Convert & Transfer</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Rate: £1 = ₦{exchangeRate?.toLocaleString()}</p>
                </div>
                <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* From → To visual */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px' }}>
                {/* From account */}
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>From</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['GBP', 'NGN'].map(acct => (
                      <button key={acct} onClick={() => setFromAccount(acct)} style={{
                        flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-md)',
                        border: `2px solid ${fromAccount === acct ? (acct === 'GBP' ? 'var(--accent-primary)' : 'var(--accent-naira)') : 'var(--border)'}`,
                        background: fromAccount === acct ? (acct === 'GBP' ? 'var(--accent-primary-dim)' : 'var(--accent-naira-dim)') : 'var(--bg-card)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                      }}>
                        <span style={{ fontSize: '20px' }}>{acct === 'GBP' ? '🇬🇧' : '🇳🇬'}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '800', color: fromAccount === acct ? (acct === 'GBP' ? 'var(--accent-primary)' : 'var(--accent-naira)') : 'var(--text-secondary)' }}>{acct}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {acct === 'GBP' ? `£${balanceGBP.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `₦${balanceNGN.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowDown size={14} color="var(--text-muted)" />
                  </div>
                </div>

                {/* To account */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{toAccount === 'GBP' ? '🇬🇧' : '🇳🇬'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{toAccount}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {toAccount === 'GBP' ? `£${balanceGBP.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `₦${balanceNGN.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} current
                    </p>
                  </div>
                  {convertedAmount > 0 && (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--accent-green)' }}>
                      +{toAccount === 'GBP' ? `£${convertedAmount.toFixed(2)}` : `₦${Math.round(convertedAmount).toLocaleString()}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount input */}
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Amount to transfer ({fromAccount})
              </p>
              <div style={{
                background: wouldOverdraw ? 'var(--accent-red-dim)' : 'var(--bg-elevated)',
                border: `1px solid ${wouldOverdraw ? 'var(--accent-red)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: 'var(--text-muted)' }}>{fromSymbol}</span>
                <input type="number" inputMode="decimal" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', color: wouldOverdraw ? 'var(--accent-red)' : 'var(--text-primary)' }}
                />
              </div>

              {wouldOverdraw && (
                <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: '700', marginBottom: '10px' }}>
                  🚫 Balance is only {fromSymbol}{fromBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              )}

              {convertedAmount > 0 && !wouldOverdraw && (
                <div style={{ background: 'var(--accent-green-dim)', border: '1px solid var(--accent-green)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '10px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-green)' }}>
                    {fromSymbol}{parseFloat(amount).toLocaleString()} → {toAccount === 'NGN' ? `₦${Math.round(convertedAmount).toLocaleString()}` : `£${convertedAmount.toFixed(2)}`}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>at rate £1 = ₦{exchangeRate?.toLocaleString()}</p>
                </div>
              )}

              <input type="text" placeholder="Notes (optional)"
                value={notes} onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '14px' }}
              />

              <motion.button onClick={handleTransfer}
                disabled={!amount || loading || wouldOverdraw}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '15px', borderRadius: 'var(--radius-md)',
                  background: (!amount || loading || wouldOverdraw) ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--accent-primary), #9c6aff)',
                  color: (!amount || wouldOverdraw) ? 'var(--text-muted)' : '#fff',
                  fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                <ArrowDown size={16} />
                {loading ? 'Transferring…' : wouldOverdraw ? 'Insufficient balance' : `Transfer ${fromAccount} → ${toAccount}`}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
