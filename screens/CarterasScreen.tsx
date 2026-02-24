import { useEffect, useState } from 'react'
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, RefreshControl
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function CarterasScreen() {
    const [wallets, setWallets] = useState<any[]>([])
    const [refreshing, setRefreshing] = useState(false)
    const [totalBalance, setTotalBalance] = useState(0)

    useEffect(() => { cargarWallets() }, [])

    const cargarWallets = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('activo', true)
            .order('created_at', { ascending: true })

        if (!data) return

        // Calcular saldo de cada cartera
        const walletsConSaldo = await Promise.all(data.map(async (w) => {
            const { data: trans } = await supabase
                .from('transactions')
                .select('monto, tipo')
                .eq('user_id', session.user.id)
                .eq('wallet_id', w.id)

            const saldo = (trans || []).reduce((acc, t) => {
                return t.tipo === 'ingreso' ? acc + Number(t.monto) : acc - Number(t.monto)
            }, Number(w.saldo_inicial))

            return { ...w, saldo }
        }))

        setWallets(walletsConSaldo)
        const total = walletsConSaldo
            .filter(w => w.tipo !== 'credito')
            .reduce((sum, w) => sum + w.saldo, 0)
        setTotalBalance(total)
    }

    const onRefresh = async () => {
        setRefreshing(true)
        await cargarWallets()
        setRefreshing(false)
    }

    const formatMonto = (n: number) =>
        new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

    const getIcono = (tipo: string) => {
        switch (tipo) {
            case 'credito': return '💳'
            case 'ahorro': return '🏦'
            case 'inversion': return '📈'
            default: return '👛'
        }
    }

    const getColor = (tipo: string) => {
        switch (tipo) {
            case 'credito': return { bg: '#1E1B4B', border: '#4338CA', text: '#818CF8' }
            case 'ahorro': return { bg: '#052E16', border: '#166534', text: '#4ADE80' }
            case 'inversion': return { bg: '#1C1917', border: '#78350F', text: '#FBBF24' }
            default: return { bg: '#0A1F1F', border: '#0D9488', text: '#2DD4BF' }
        }
    }

    const getTipoLabel = (tipo: string) => {
        switch (tipo) {
            case 'credito': return 'Tarjeta de crédito'
            case 'ahorro': return 'Cuenta de ahorro'
            case 'inversion': return 'Inversión'
            default: return 'Efectivo / Débito'
        }
    }

    const efectivo = wallets.filter(w => w.tipo === 'efectivo' || w.tipo === 'debito')
    const ahorro = wallets.filter(w => w.tipo === 'ahorro')
    const credito = wallets.filter(w => w.tipo === 'credito')
    const inversion = wallets.filter(w => w.tipo === 'inversion')

    const grupos = [
        { label: '👛 Efectivo y débito', items: efectivo },
        { label: '🏦 Ahorros', items: ahorro },
        { label: '💳 Crédito', items: credito },
        { label: '📈 Inversiones', items: inversion },
    ].filter(g => g.items.length > 0)

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.titulo}>Carteras</Text>
            </View>

            {/* Balance total */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Balance total</Text>
                <Text style={styles.balanceMonto}>L {formatMonto(totalBalance)}</Text>
                <Text style={styles.balanceSub}>
                    {wallets.filter(w => w.tipo !== 'credito').length} carteras activas
                </Text>
                <View style={styles.balanceBarra}>
                    {wallets.filter(w => w.tipo !== 'credito').map((w, i) => (
                        <View
                            key={w.id}
                            style={{
                                flex: Number(w.saldo),
                                height: 6,
                                backgroundColor: ['#0D9488', '#6366F1', '#10B981', '#F59E0B'][i % 4],
                                borderRadius: 3,
                            }}
                        />
                    ))}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14B8A6" />}
            >
                {wallets.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>◈</Text>
                        <Text style={styles.emptyText}>Sin carteras registradas</Text>
                        <Text style={styles.emptySub}>Toca + para agregar una</Text>
                    </View>
                ) : (
                    grupos.map(grupo => (
                        <View key={grupo.label} style={{ marginBottom: 24 }}>
                            <Text style={styles.grupoLabel}>{grupo.label}</Text>
                            <View style={styles.grupo}>
                                {grupo.items.map((w, idx) => {
                                    const color = getColor(w.tipo)
                                    return (
                                        <View
                                            key={w.id}
                                            style={[
                                                styles.walletCard,
                                                { backgroundColor: color.bg, borderColor: color.border },
                                                idx < grupo.items.length - 1 && styles.walletCardBorder
                                            ]}
                                        >
                                            <View style={styles.walletLeft}>
                                                <View style={[styles.walletIcono, { borderColor: color.border }]}>
                                                    <Text style={{ fontSize: 22 }}>{getIcono(w.tipo)}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.walletNombre}>{w.nombre}</Text>
                                                    <Text style={styles.walletTipo}>{getTipoLabel(w.tipo)}</Text>
                                                    {w.tipo === 'credito' && w.credito_limite && (
                                                        <Text style={styles.walletSub}>
                                                            Límite: L {formatMonto(Number(w.credito_limite))}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={[styles.walletSaldo, { color: color.text }]}>
                                                    L {formatMonto(Number(w.saldo))}
                                                </Text>
                                                {w.tipo === 'credito' && w.credito_limite && (
                                                    <Text style={styles.walletDisponible}>
                                                        Disponible: L {formatMonto(Number(w.credito_limite) - Number(w.saldo))}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    )
                                })}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020817' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    titulo: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
    balanceCard: {
        marginHorizontal: 16,
        backgroundColor: '#0F172A',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        marginBottom: 16,
    },
    balanceLabel: { color: '#64748B', fontSize: 13, marginBottom: 6 },
    balanceMonto: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
    balanceSub: { color: '#475569', fontSize: 12, marginBottom: 12 },
    balanceBarra: { flexDirection: 'row', gap: 3, height: 6 },
    grupoLabel: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    grupo: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        overflow: 'hidden',
    },
    walletCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    walletCardBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    walletIcono: {
        width: 44,
        height: 44,
        backgroundColor: '#1E293B',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    walletNombre: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    walletTipo: { color: '#64748B', fontSize: 12, marginTop: 2 },
    walletSub: { color: '#475569', fontSize: 11, marginTop: 1 },
    walletSaldo: { fontSize: 16, fontWeight: 'bold' },
    walletDisponible: { color: '#64748B', fontSize: 11, marginTop: 2 },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { color: '#94A3B8', fontSize: 15, marginBottom: 4 },
    emptySub: { color: '#475569', fontSize: 13 },
})