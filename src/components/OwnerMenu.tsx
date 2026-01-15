/**
 * Owner Menu Component
 * 
 * Hidden admin panel accessed via logo tap (5x in 2 seconds)
 * - PIN verification with lockout
 * - View/reset counters
 * - Audit log access
 * - CSV export
 */

import { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, RotateCcw, Download, Shield, AlertTriangle, FileText, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    hashPin,
    verifyPin,
    isLockedOut,
    getRemainingLockoutTime,
    recordFailedAttempt,
    clearFailedAttempts,
    getRemainingAttempts,
    DEFAULT_PIN_HASH,
} from '@/lib/owner-auth';
import {
    getOwnerPinHash,
    setOwnerPinHash,
    logResetEvent,
    logPinChanged,
    getAuditSummary,
    AuditSummary,
} from '@/lib/audit-log';
import { useReceiptCounter } from '@/hooks/useReceiptCounter';
import { ReceiptType, RECEIPT_PREFIXES } from '@/types/hotel';
import { RECEIPT_TYPE_LABELS } from '@/lib/receipt-counter';
import { exportTodayCSV } from '@/lib/export-csv';
import { RoomManagement } from '@/components/RoomManagement';

interface OwnerMenuProps {
    onClose: () => void;
}

type MenuView = 'pin' | 'main' | 'reset' | 'change-pin' | 'rooms';

export function OwnerMenu({ onClose }: OwnerMenuProps) {
    const [view, setView] = useState<MenuView>('pin');
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const [loading, setLoading] = useState(false);

    // Reset dialog state
    const [resetType, setResetType] = useState<ReceiptType | null>(null);
    const [resetReason, setResetReason] = useState('');

    // Change PIN state
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    // Counter data
    const { getCounter, resetCounterValue, getAuditSummary: getCounterSummary } = useReceiptCounter();
    const [summaries, setSummaries] = useState<AuditSummary[]>([]);

    // Update lockout timer
    useEffect(() => {
        const updateLockout = () => {
            if (isLockedOut()) {
                setLockoutSeconds(getRemainingLockoutTime());
            } else {
                setLockoutSeconds(0);
            }
        };

        updateLockout();
        const interval = setInterval(updateLockout, 1000);
        return () => clearInterval(interval);
    }, []);

    // Load audit summaries when entering main view
    useEffect(() => {
        if (view === 'main') {
            loadSummaries();
        }
    }, [view]);

    const loadSummaries = async () => {
        try {
            const data = await getAuditSummary();
            setSummaries(data);
        } catch (err) {
            console.error('Failed to load summaries:', err);
        }
    };

    const handlePinSubmit = async () => {
        if (lockoutSeconds > 0) return;

        setLoading(true);
        setError(null);

        try {
            // Get stored PIN hash (or use default)
            let storedHash = await getOwnerPinHash();
            if (!storedHash) {
                storedHash = DEFAULT_PIN_HASH;
            }

            const isValid = await verifyPin(pin, storedHash);

            if (isValid) {
                clearFailedAttempts();
                setView('main');
                setPin('');
            } else {
                const nowLockedOut = recordFailedAttempt();
                if (nowLockedOut) {
                    setError('Terlalu banyak percobaan. Coba lagi dalam 15 menit.');
                    setLockoutSeconds(getRemainingLockoutTime());
                } else {
                    const remaining = getRemainingAttempts();
                    setError(`PIN salah. ${remaining} percobaan tersisa.`);
                }
            }
        } catch (err) {
            setError('Terjadi kesalahan. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!resetType || !resetReason.trim()) {
            setError('Alasan wajib diisi.');
            return;
        }

        setLoading(true);
        try {
            const { from, to } = resetCounterValue(resetType, 0);
            await logResetEvent(resetType, from, to, resetReason.trim());

            setResetType(null);
            setResetReason('');
            setView('main');
            loadSummaries();
        } catch (err) {
            setError('Gagal reset counter.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePin = async () => {
        if (newPin.length < 4) {
            setError('PIN minimal 4 digit.');
            return;
        }
        if (newPin !== confirmPin) {
            setError('PIN tidak cocok.');
            return;
        }

        setLoading(true);
        try {
            const hash = await hashPin(newPin);
            await setOwnerPinHash(hash);
            await logPinChanged();

            setNewPin('');
            setConfirmPin('');
            setView('main');
            setError(null);
        } catch (err) {
            setError('Gagal mengubah PIN.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            await exportTodayCSV();
        } catch (err) {
            setError('Gagal export CSV.');
        }
    };

    const formatLockout = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Owner Menu
                    </DialogTitle>
                    <DialogDescription>
                        {view === 'pin' && 'Masukkan PIN untuk mengakses menu admin.'}
                        {view === 'main' && 'Kelola counter dan audit sistem.'}
                        {view === 'reset' && `Reset counter ${resetType ? RECEIPT_TYPE_LABELS[resetType] : ''}`}
                        {view === 'change-pin' && 'Ubah PIN owner.'}
                    </DialogDescription>
                </DialogHeader>

                {/* PIN Entry View */}
                {view === 'pin' && (
                    <div className="space-y-4">
                        {lockoutSeconds > 0 ? (
                            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
                                <Lock className="h-5 w-5" />
                                <div>
                                    <p className="font-medium">Akses Terkunci</p>
                                    <p className="text-sm">Coba lagi dalam {formatLockout(lockoutSeconds)}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="pin">PIN Owner</Label>
                                    <div className="relative">
                                        <Input
                                            id="pin"
                                            type={showPin ? 'text' : 'password'}
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            placeholder="Masukkan PIN"
                                            maxLength={10}
                                            className="pr-10"
                                            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0"
                                            onClick={() => setShowPin(!showPin)}
                                        >
                                            {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}

                                <DialogFooter>
                                    <Button variant="outline" onClick={onClose}>Batal</Button>
                                    <Button onClick={handlePinSubmit} disabled={loading || !pin}>
                                        {loading ? 'Memverifikasi...' : 'Masuk'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </div>
                )}

                {/* Main Menu View */}
                {view === 'main' && (
                    <div className="space-y-4">
                        {/* Counter Summary */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">STATUS COUNTER</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {(['checkin', 'checkout', 'kantin_tamu', 'kantin_nontamu'] as ReceiptType[]).map((type) => {
                                    const value = getCounter(type);
                                    return (
                                        <div key={type} className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">{RECEIPT_TYPE_LABELS[type]}</p>
                                                <p className="font-mono font-bold">{RECEIPT_PREFIXES[type]}{value.toString().padStart(4, '0')}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => {
                                                    setResetType(type);
                                                    setView('reset');
                                                }}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={handleExport}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV Hari Ini
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => setView('rooms')}
                            >
                                <BedDouble className="mr-2 h-4 w-4" />
                                Kelola Kamar
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => setView('change-pin')}
                            >
                                <Lock className="mr-2 h-4 w-4" />
                                Ubah PIN
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>Tutup</Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Reset Counter View */}
                {view === 'reset' && resetType && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-4 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            <div>
                                <p className="font-medium">Perhatian!</p>
                                <p className="text-sm">Reset counter akan tercatat di audit log.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-muted-foreground">Counter saat ini:</p>
                            <p className="font-mono text-2xl font-bold">
                                {RECEIPT_PREFIXES[resetType]}{getCounter(resetType).toString().padStart(4, '0')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Akan direset ke: {RECEIPT_PREFIXES[resetType]}0000
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Alasan Reset (Wajib)</Label>
                            <Textarea
                                id="reason"
                                value={resetReason}
                                onChange={(e) => setResetReason(e.target.value)}
                                placeholder="Contoh: Pergantian hari, Audit bulanan, dll."
                                rows={3}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setResetType(null);
                                setResetReason('');
                                setView('main');
                            }}>
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReset}
                                disabled={loading || !resetReason.trim()}
                            >
                                {loading ? 'Mereset...' : 'Reset Counter'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Change PIN View */}
                {view === 'change-pin' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPin">PIN Baru</Label>
                            <Input
                                id="newPin"
                                type="password"
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                placeholder="Minimal 4 digit"
                                maxLength={10}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPin">Konfirmasi PIN Baru</Label>
                            <Input
                                id="confirmPin"
                                type="password"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                placeholder="Ulangi PIN baru"
                                maxLength={10}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setNewPin('');
                                setConfirmPin('');
                                setView('main');
                            }}>
                                Batal
                            </Button>
                            <Button onClick={handleChangePin} disabled={loading}>
                                {loading ? 'Menyimpan...' : 'Simpan PIN'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Room Management View */}
                {view === 'rooms' && (
                    <RoomManagement onBack={() => setView('main')} />
                )}
            </DialogContent>
        </Dialog>
    );
}
