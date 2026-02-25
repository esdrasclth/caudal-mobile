import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { supabase } from '../lib/supabase'
import NuevaTransaccion from './NuevaTransaccionScreen'
import GraficaPastel from '../components/GraficaPastel'
import GraficaMovimientosMensuales from '../components/GraficaMovimientosMensuales'
import CalendarioFinanciero from '../components/CalendarioFinanciero'

export default function DashboardScreen() {
    const [usuario, setUsuario] = useState<any>(null)
    const [resumen, setResumen] = useState({ ingresos: 0, gastos: 0 })
    const [transacciones, setTransacciones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [vistaGrafica, setVistaGrafica] = useState<'gasto' | 'ingreso'>('gasto')
    const [mesOffset, setMesOffset] = useState(0)

    useEffect(() => { cargarDatos() }, [mesOffset])

    const cargarDatos = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const userId = session.user.id
        const { inicio, fin } = getMesInfo(mesOffset)

        const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', userId).single()
        setUsuario(profile)

        const { data } = await supabase
            .from('transactions')
            .select('*, categories(nombre, icono, color)')
            .eq('user_id', userId)
            .gte('fecha', inicio)
            .lte('fecha', fin)
            .order('fecha', { ascending: false })

        setTransacciones(data || [])

        const ingresos = (data || []).filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + Number(t.monto), 0)
        const gastos = (data || []).filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + Number(t.monto), 0)
        setResumen({ ingresos, gastos })
        setLoading(false)
    }

    const onRefresh = async () => {
        setRefreshing(true)
        await cargarDatos()
        setRefreshing(false)
    }

    const formatMonto = (n: number) =>
        new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

    const saludo = () => {
        const h = new Date().getHours()
        if (h < 12) return 'Buenos días'
        if (h < 18) return 'Buenas tardes'
        return 'Buenas noches'
    }

    const getMesInfo = (offset: number) => {
        const fecha = new Date()
        fecha.setDate(1)
        fecha.setMonth(fecha.getMonth() + offset)
        const inicio = fecha.toISOString().split('T')[0]
        const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
            .toISOString().split('T')[0]
        const nombre = fecha.toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })
        return { inicio, fin, nombre }
    }

    const { mes, año } = (() => {
        const fecha = new Date()
        fecha.setMonth(fecha.getMonth() + mesOffset)
        return { mes: fecha.getMonth() + 1, año: fecha.getFullYear() }
    })()

    const mesNombre = new Date().toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })
    const saldo = resumen.ingresos - resumen.gastos

    return (
        <View style={{ flex: 1, backgroundColor: '#020817' }}>



            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14B8A6" />}
            >

                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.saludoSmall}>{saludo()},</Text>
                            <Text style={styles.nombre}>{usuario?.nombre?.split(' ')[0]}</Text>
                        </View>
                        <TouchableOpacity style={styles.notifBtn}>
                            <Text style={{ fontSize: 20 }}>🔔</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ marginHorizontal: 20 }}>
                    {/* Cards resumen */}
                    <View style={{ marginTop: -30 }}>
                        <View style={styles.cardsRow}>

                            <View style={[styles.card, styles.cardIngresos]}>
                                <Text style={styles.cardLabel}>Ingresos</Text>
                                <Text style={styles.cardEmoji}>💰</Text>
                                <Text style={[styles.cardMonto, { color: '#4ADE80' }]}>
                                    L {formatMonto(resumen.ingresos)}
                                </Text>
                                <Text style={styles.cardSub}>Este mes</Text>
                            </View>

                            <View style={[styles.card, styles.cardGastos]}>
                                <Text style={styles.cardLabel}>Gastos</Text>
                                <Text style={styles.cardEmoji}>💸</Text>
                                <Text style={[styles.cardMonto, { color: '#F87171' }]}>
                                    L {formatMonto(resumen.gastos)}
                                </Text>
                                <Text style={styles.cardSub}>Este mes</Text>
                            </View>

                        </View>
                    </View>

                    {/* Saldo neto */}
                    <View style={[styles.cardSaldo, saldo >= 0 ? styles.saldoPositivo : styles.saldoNegativo]}>
                        <View>
                            <Text style={styles.cardLabel}>Saldo neto</Text>
                            <Text style={[styles.saldoMonto, { color: saldo >= 0 ? '#2DD4BF' : '#F87171' }]}>
                                L {formatMonto(saldo)}
                            </Text>
                            <Text style={styles.cardSub}>Ingresos - Gastos</Text>
                        </View>
                        <Text style={{ fontSize: 36 }}>📊</Text>
                    </View>

                    {/* Navegador de meses */}
                    <View style={styles.navegadorMes}>
                        <TouchableOpacity
                            style={styles.navegadorBtn}
                            onPress={() => setMesOffset(prev => prev - 1)}
                        >
                            <Text style={styles.navegadorFlecha}>‹</Text>
                        </TouchableOpacity>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.navegadorMesNombre}>
                                {getMesInfo(mesOffset).nombre}
                            </Text>
                            {mesOffset !== 0 && (
                                <TouchableOpacity onPress={() => setMesOffset(0)}>
                                    <Text style={styles.navegadorHoy}>Volver al mes actual</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.navegadorBtn, mesOffset === 0 && { opacity: 0.3 }]}
                            onPress={() => setMesOffset(prev => prev + 1)}
                            disabled={mesOffset === 0}
                        >
                            <Text style={styles.navegadorFlecha}>›</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.seccion, { marginBottom: 16 }]}>
                        <Text style={styles.seccionTitulo}>
                            {vistaGrafica === 'gasto' ? 'Gastos por categoría' : 'Ingresos por categoría'}
                        </Text>
                        <Text style={styles.seccionSub}>Distribución del mes</Text>
                        <GraficaPastel
                            transacciones={transacciones}
                            vista={vistaGrafica}
                            onVistaChange={setVistaGrafica}
                        />
                    </View>

                    <View style={[styles.seccion, { marginBottom: 16 }]}>
                        <Text style={styles.seccionTitulo}>
                            Gastos e Ingresos por Categoria
                        </Text>
                        <Text style={styles.seccionSub}>Distribucion del mes</Text>
                        <GraficaMovimientosMensuales
                            ingresos={resumen.ingresos}
                            gastos={resumen.gastos}
                        />
                    </View>

                    <View style={[styles.seccion, { marginBottom: 16 }]}>
                        <Text style={styles.seccionTitulo}>Calendario Financiero</Text>
                        <Text style={styles.seccionSub}>Actividad diaria del mes</Text>
                        <CalendarioFinanciero
                            transacciones={transacciones}
                            mes={mes}
                            año={año}
                        />
                    </View>

                    {/* Últimas transacciones */}
                    <View style={styles.seccion}>
                        <Text style={styles.seccionTitulo}>Últimas transacciones</Text>
                        <Text style={styles.seccionSub}>{transacciones.length} este mes</Text>

                        {transacciones.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={{ fontSize: 40 }}>📋</Text>
                                <Text style={styles.emptyText}>Sin transacciones este mes</Text>
                            </View>
                        ) : (
                            transacciones.slice(0, 8).map(t => (
                                <View key={t.id} style={styles.transaccion}>
                                    <View style={styles.transaccionIcono}>
                                        <Text style={{ fontSize: 20 }}>{t.categories?.icono || '💸'}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.transaccionNombre}>
                                            {t.descripcion || t.categories?.nombre}
                                        </Text>
                                        <Text style={styles.transaccionCat}>
                                            {t.categories?.nombre} · {new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-HN', { day: 'numeric', month: 'short' })}
                                        </Text>
                                    </View>
                                    <Text style={[styles.transaccionMonto, { color: t.tipo === 'ingreso' ? '#4ADE80' : '#F87171' }]}>
                                        {t.tipo === 'ingreso' ? '+' : '-'}L {formatMonto(Number(t.monto))}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowForm(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <NuevaTransaccion
                visible={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={cargarDatos}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020817' },
    content: { paddingBottom: 40, paddingHorizontal: 0 },
    header: {
        width: '100%',
        backgroundColor: '#0F172A',
        paddingTop: 70,
        paddingBottom: 60,
        paddingHorizontal: 20,
        marginHorizontal: 0,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    saludoSmall: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 16,
    },

    nombre: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 4,
    },

    notifBtn: {
        width: 52,
        height: 52,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mesNombre: {
        color: '#64748B',
        fontSize: 13,
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    saludo: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
    },
    cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    card: { flex: 1, borderRadius: 20, padding: 16, borderWidth: 1, },
    cardIngresos: { backgroundColor: '#0F2A1A', borderColor: '#166534' },
    cardGastos: { backgroundColor: '#2A0F0F', borderColor: '#991B1B' },
    cardSaldo: { borderRadius: 20, padding: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    saldoPositivo: { backgroundColor: '#0A1F1F', borderColor: '#0D9488' },
    saldoNegativo: { backgroundColor: '#2A0F0F', borderColor: '#991B1B' },
    cardLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 8 },
    cardEmoji: { fontSize: 20, marginBottom: 8 },
    cardMonto: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    saldoMonto: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    cardSub: { color: '#475569', fontSize: 11 },
    seccion: { backgroundColor: '#0F172A', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1E293B' },
    seccionTitulo: { color: '#FFFFFF', fontWeight: '600', fontSize: 16, marginBottom: 2 },
    seccionSub: { color: '#64748B', fontSize: 12, marginBottom: 16 },
    empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyText: { color: '#64748B', fontSize: 14 },
    transaccion: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
    transaccionIcono: { width: 40, height: 40, backgroundColor: '#1E293B', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    transaccionNombre: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
    transaccionCat: { color: '#64748B', fontSize: 12, marginTop: 2 },
    transaccionMonto: { fontSize: 14, fontWeight: '600' },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        backgroundColor: '#0D9488',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
    navegadorMes: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    navegadorBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#1E293B',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    navegadorFlecha: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '300',
    },
    navegadorMesNombre: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    navegadorHoy: {
        color: '#14B8A6',
        fontSize: 12,
        marginTop: 4,
    },
})