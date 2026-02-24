import { useEffect, useState } from 'react'
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, RefreshControl, TextInput
} from 'react-native'
import { supabase } from '../lib/supabase'
import NuevaTransaccion from './NuevaTransaccionScreen'

export default function TransaccionesScreen() {
    const [transacciones, setTransacciones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [filtro, setFiltro] = useState<'todos' | 'ingreso' | 'gasto'>('todos')
    const [busqueda, setBusqueda] = useState('')
    const [showForm, setShowForm] = useState(false)

    useEffect(() => { cargarTransacciones() }, [])

    const cargarTransacciones = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session:', session?.user?.id)

        if (!session?.user) return

        const { data, error } = await supabase
            .from('transactions')
            .select('*, categories(nombre, icono), wallets!transactions_wallet_id_fkey(nombre)')
            .eq('user_id', session.user.id)
            .order('fecha', { ascending: false })
            .limit(100)

        console.log('Transacciones:', data?.length, 'Error:', error)
        setTransacciones(data || [])
        setLoading(false)
    }

    const onRefresh = async () => {
        setRefreshing(true)
        await cargarTransacciones()
        setRefreshing(false)
    }

    const formatMonto = (n: number) =>
        new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

    const filtradas = transacciones
        .filter(t => filtro === 'todos' ? true : t.tipo === filtro)
        .filter(t => {
            if (!busqueda) return true
            const q = busqueda.toLowerCase()
            return (
                t.descripcion?.toLowerCase().includes(q) ||
                t.categories?.nombre?.toLowerCase().includes(q)
            )
        })

    // Agrupar por fecha
    const agrupadas = filtradas.reduce((acc: any, t) => {
        const fecha = t.fecha
        if (!acc[fecha]) acc[fecha] = []
        acc[fecha].push(t)
        return acc
    }, {})

    const fechas = Object.keys(agrupadas).sort((a, b) => b.localeCompare(a))

    const formatFecha = (fecha: string) => {
        const d = new Date(fecha + 'T12:00:00')
        const hoy = new Date()
        const ayer = new Date()
        ayer.setDate(hoy.getDate() - 1)

        if (d.toDateString() === hoy.toDateString()) return 'Hoy'
        if (d.toDateString() === ayer.toDateString()) return 'Ayer'
        return d.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })
    }

    const totalFiltrado = filtradas.reduce((sum, t) => {
        return t.tipo === 'ingreso' ? sum + Number(t.monto) : sum - Number(t.monto)
    }, 0)

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.titulo}>Movimientos</Text>
                <Text style={[styles.totalHeader, { color: totalFiltrado >= 0 ? '#4ADE80' : '#F87171' }]}>
                    {totalFiltrado >= 0 ? '+' : ''}L {formatMonto(totalFiltrado)}
                </Text>
            </View>

            {/* Buscador */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    value={busqueda}
                    onChangeText={setBusqueda}
                    placeholder="Buscar transacción..."
                    placeholderTextColor="#475569"
                />
                {busqueda ? (
                    <TouchableOpacity onPress={() => setBusqueda('')}>
                        <Text style={{ color: '#64748B', fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Filtros */}
            <View style={styles.filtros}>
                {[
                    { valor: 'todos', label: '📋 Todos' },
                    { valor: 'ingreso', label: '💰 Ingresos' },
                    { valor: 'gasto', label: '💸 Gastos' },
                ].map(f => (
                    <TouchableOpacity
                        key={f.valor}
                        onPress={() => setFiltro(f.valor as any)}
                        style={[styles.filtroBtn, filtro === f.valor && styles.filtroBtnActivo]}
                    >
                        <Text style={[styles.filtroBtnText, filtro === f.valor && styles.filtroBtnTextActivo]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Lista agrupada */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14B8A6" />}
            >
                {fechas.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
                        <Text style={styles.emptyText}>Sin transacciones</Text>
                    </View>
                ) : (
                    fechas.map(fecha => (
                        <View key={fecha} style={{ marginBottom: 20 }}>
                            {/* Encabezado de fecha */}
                            <View style={styles.fechaHeader}>
                                <Text style={styles.fechaLabel}>{formatFecha(fecha)}</Text>
                                <Text style={styles.fechaSub}>
                                    {agrupadas[fecha].length} movimiento{agrupadas[fecha].length !== 1 ? 's' : ''}
                                </Text>
                            </View>

                            {/* Transacciones del día */}
                            <View style={styles.grupo}>
                                {agrupadas[fecha].map((t: any, idx: number) => (
                                    <View
                                        key={t.id}
                                        style={[
                                            styles.transaccion,
                                            idx < agrupadas[fecha].length - 1 && styles.transaccionBorder
                                        ]}
                                    >
                                        <View style={styles.icono}>
                                            <Text style={{ fontSize: 20 }}>{t.categories?.icono || '💸'}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.nombre}>
                                                {t.descripcion || t.categories?.nombre || 'Sin descripción'}
                                            </Text>
                                            <Text style={styles.cat}>
                                                {t.categories?.nombre}
                                                {t.wallets?.nombre ? ` · ${t.wallets.nombre}` : ''}
                                            </Text>
                                        </View>
                                        <Text style={[styles.monto, { color: t.tipo === 'ingreso' ? '#4ADE80' : '#F87171' }]}>
                                            {t.tipo === 'ingreso' ? '+' : '-'}L {formatMonto(Number(t.monto))}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))
                )}
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
                onSuccess={cargarTransacciones}
            />

        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020817' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    titulo: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
    totalHeader: { fontSize: 16, fontWeight: '600' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        marginHorizontal: 16,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#1E293B',
        marginBottom: 12,
        gap: 8,
    },
    searchIcon: { fontSize: 16 },
    searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15 },
    filtros: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 8,
    },
    filtroBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    filtroBtnActivo: {
        borderColor: '#0D9488',
        backgroundColor: '#0A2020',
    },
    filtroBtnText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
    filtroBtnTextActivo: { color: '#14B8A6' },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { color: '#64748B', fontSize: 15 },
    fechaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    fechaLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    fechaSub: { color: '#475569', fontSize: 12 },
    grupo: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        overflow: 'hidden',
    },
    transaccion: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    transaccionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    icono: {
        width: 42,
        height: 42,
        backgroundColor: '#1E293B',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nombre: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
    cat: { color: '#64748B', fontSize: 12, marginTop: 2 },
    monto: { fontSize: 14, fontWeight: '600' },
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
})