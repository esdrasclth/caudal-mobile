import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl
} from 'react-native'
import { supabase } from '../lib/supabase'
import NuevoPresupuesto from './NuevoPresupuestoScreen'

export default function PresupuestoScreen() {
  const [presupuestos, setPresupuestos] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState<'activos' | 'todos'>('activos')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { cargarPresupuestos() }, [])

  const cargarPresupuestos = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const mesActual = new Date().getMonth() + 1
    const añoActual = new Date().getFullYear()
    const inicioMes = `${añoActual}-${String(mesActual).padStart(2, '0')}-01`

    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, categories(nombre, icono, color)')
      .eq('user_id', session.user.id)
      .eq('mes', mesActual)
      .eq('año', añoActual)

    if (!budgets) return

    // Calcular gastado por categoría
    const resultado = await Promise.all(budgets.map(async (budget) => {
      const { data: trans } = await supabase
        .from('transactions')
        .select('monto')
        .eq('user_id', session.user.id)
        .eq('category_id', budget.category_id)
        .eq('tipo', 'gasto')
        .gte('fecha', inicioMes)

      const gastado = (trans || []).reduce((acc, t) => acc + Number(t.monto), 0)
      const porcentaje = Math.min((gastado / budget.monto_limite) * 100, 100)

      return { ...budget, gastado, porcentaje }
    }))

    setPresupuestos(resultado)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await cargarPresupuestos()
    setRefreshing(false)
  }

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

  const mesNombre = new Date().toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })

  const totalLimite = presupuestos.reduce((sum, p) => sum + Number(p.monto_limite), 0)
  const totalGastado = presupuestos.reduce((sum, p) => sum + p.gastado, 0)
  const totalPorcentaje = totalLimite > 0 ? Math.min((totalGastado / totalLimite) * 100, 100) : 0

  const filtrados = presupuestos.filter(p =>
    filtro === 'activos' ? p.porcentaje < 100 : true
  )

  const getColor = (porcentaje: number) => {
    if (porcentaje >= 100) return '#F87171'
    if (porcentaje >= 80) return '#FBBF24'
    return '#2DD4BF'
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Presupuesto</Text>
          <Text style={styles.sub}>{mesNombre}</Text>
        </View>
      </View>

      {/* Resumen general */}
      <View style={styles.resumen}>
        <View style={styles.resumenRow}>
          <View>
            <Text style={styles.resumenLabel}>Gastado</Text>
            <Text style={styles.resumenMonto}>L {formatMonto(totalGastado)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.resumenLabel}>Límite total</Text>
            <Text style={styles.resumenMonto}>L {formatMonto(totalLimite)}</Text>
          </View>
        </View>

        {/* Barra general */}
        <View style={styles.barraContainer}>
          <View style={[styles.barra, {
            width: `${totalPorcentaje}%` as any,
            backgroundColor: getColor(totalPorcentaje)
          }]} />
        </View>
        <Text style={[styles.porcentajeText, { color: getColor(totalPorcentaje) }]}>
          {Math.round(totalPorcentaje)}% del presupuesto total usado
        </Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {[
          { valor: 'activos', label: '🟢 Activos' },
          { valor: 'todos', label: '📋 Todos' },
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

      {/* Lista */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14B8A6" />}
      >
        {filtrados.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>◎</Text>
            <Text style={styles.emptyText}>Sin presupuestos este mes</Text>
          </View>
        ) : (
          filtrados.map(p => (
            <View key={p.id} style={[styles.card, p.porcentaje >= 100 && styles.cardVencido]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcono}>
                  <Text style={{ fontSize: 22 }}>{p.categories?.icono || '📦'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNombre}>{p.categories?.nombre}</Text>
                  <Text style={styles.cardSub}>
                    L {formatMonto(p.gastado)} de L {formatMonto(Number(p.monto_limite))}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.cardPorcentaje, { color: getColor(p.porcentaje) }]}>
                    {Math.round(p.porcentaje)}%
                  </Text>
                  {p.porcentaje >= 100 ? (
                    <Text style={styles.badge}>🚨 Excedido</Text>
                  ) : p.porcentaje >= 80 ? (
                    <Text style={styles.badgeWarning}>⚠️ Cerca</Text>
                  ) : null}
                </View>
              </View>

              {/* Barra */}
              <View style={styles.barraContainer}>
                <View style={[styles.barra, {
                  width: `${p.porcentaje}%` as any,
                  backgroundColor: getColor(p.porcentaje)
                }]} />
              </View>

              {/* Restante */}
              <Text style={styles.restante}>
                {p.porcentaje >= 100
                  ? `Excedido por L ${formatMonto(p.gastado - Number(p.monto_limite))}`
                  : `Te quedan L ${formatMonto(Number(p.monto_limite) - p.gastado)}`
                }
              </Text>
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

      <NuevoPresupuesto
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={cargarPresupuestos}
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
  sub: { color: '#64748B', fontSize: 13, textTransform: 'capitalize', marginTop: 2 },
  resumen: {
    marginHorizontal: 16,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  resumenLabel: { color: '#64748B', fontSize: 12, marginBottom: 4 },
  resumenMonto: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  barraContainer: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barra: { height: 8, borderRadius: 4 },
  porcentajeText: { fontSize: 12 },
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
  filtroBtnActivo: { borderColor: '#0D9488', backgroundColor: '#0A2020' },
  filtroBtnText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  filtroBtnTextActivo: { color: '#14B8A6' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#64748B', fontSize: 15 },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  cardVencido: { borderColor: '#991B1B' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIcono: {
    width: 44,
    height: 44,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNombre: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cardSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  cardPorcentaje: { fontSize: 18, fontWeight: 'bold' },
  badge: { fontSize: 11, color: '#F87171', marginTop: 2 },
  badgeWarning: { fontSize: 11, color: '#FBBF24', marginTop: 2 },
  restante: { color: '#64748B', fontSize: 12, marginTop: 8 },
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