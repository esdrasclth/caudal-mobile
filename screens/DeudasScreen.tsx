import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function DeudasScreen() {
  const [deudas, setDeudas] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState<'todas' | 'debo' | 'me_deben'>('todas')

  useEffect(() => { cargarDeudas() }, [])

  const cargarDeudas = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('completada', { ascending: true })
      .order('created_at', { ascending: false })

    setDeudas(data || [])
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await cargarDeudas()
    setRefreshing(false)
  }

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

  const filtradas = deudas.filter(d =>
    filtro === 'todas' ? true : d.tipo === filtro
  )

  const totalDebo = deudas
    .filter(d => d.tipo === 'debo' && !d.completada)
    .reduce((acc, d) => acc + Number(d.monto_total) - Number(d.monto_pagado), 0)

  const totalMeDeben = deudas
    .filter(d => d.tipo === 'me_deben' && !d.completada)
    .reduce((acc, d) => acc + Number(d.monto_total) - Number(d.monto_pagado), 0)

  const porcentaje = (deuda: any) =>
    Math.min((Number(deuda.monto_pagado) / Number(deuda.monto_total)) * 100, 100)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Deudas</Text>
      </View>

      {/* Resumen */}
      <View style={styles.resumenRow}>
        <View style={[styles.resumenCard, { borderColor: '#991B1B', backgroundColor: '#2A0F0F' }]}>
          <Text style={styles.resumenLabel}>Lo que debo</Text>
          <Text style={[styles.resumenMonto, { color: '#F87171' }]}>
            L {formatMonto(totalDebo)}
          </Text>
          <Text style={styles.resumenSub}>
            {deudas.filter(d => d.tipo === 'debo' && !d.completada).length} activas
          </Text>
        </View>
        <View style={[styles.resumenCard, { borderColor: '#166534', backgroundColor: '#052E16' }]}>
          <Text style={styles.resumenLabel}>Me deben</Text>
          <Text style={[styles.resumenMonto, { color: '#4ADE80' }]}>
            L {formatMonto(totalMeDeben)}
          </Text>
          <Text style={styles.resumenSub}>
            {deudas.filter(d => d.tipo === 'me_deben' && !d.completada).length} activas
          </Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {[
          { valor: 'todas', label: '📋 Todas' },
          { valor: 'debo', label: '💸 Debo' },
          { valor: 'me_deben', label: '💰 Me deben' },
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
        {filtradas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🤝</Text>
            <Text style={styles.emptyText}>Sin deudas registradas</Text>
            <Text style={styles.emptySub}>Toca + para agregar una</Text>
          </View>
        ) : (
          filtradas.map(deuda => {
            const pendiente = Number(deuda.monto_total) - Number(deuda.monto_pagado)
            const pct = porcentaje(deuda)
            const vencida = deuda.fecha_limite &&
              new Date(deuda.fecha_limite) < new Date() &&
              !deuda.completada

            return (
              <View
                key={deuda.id}
                style={[
                  styles.card,
                  deuda.completada && { opacity: 0.5 },
                  vencida && { borderColor: '#991B1B' }
                ]}
              >
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={[
                    styles.cardIcono,
                    { backgroundColor: deuda.tipo === 'debo' ? '#450A0A' : '#052E16' }
                  ]}>
                    <Text style={{ fontSize: 22 }}>
                      {deuda.tipo === 'debo' ? '💸' : '💰'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.cardNombre}>{deuda.nombre}</Text>
                      {deuda.completada && (
                        <View style={styles.badgeCompletada}>
                          <Text style={{ color: '#2DD4BF', fontSize: 10 }}>✅ Pagada</Text>
                        </View>
                      )}
                      {vencida && (
                        <View style={styles.badgeVencida}>
                          <Text style={{ color: '#F87171', fontSize: 10 }}>⚠️ Vencida</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardDesc}>
                      {deuda.tipo === 'debo' ? 'Le debo a' : 'Me debe'} · {deuda.descripcion || 'Sin descripción'}
                    </Text>
                  </View>
                </View>

                {/* Montos */}
                <View style={styles.montosRow}>
                  <View style={styles.montoItem}>
                    <Text style={styles.montoLabel}>Total</Text>
                    <Text style={styles.montoValor}>L {formatMonto(Number(deuda.monto_total))}</Text>
                  </View>
                  <View style={styles.montoItem}>
                    <Text style={styles.montoLabel}>Pagado</Text>
                    <Text style={[styles.montoValor, { color: '#2DD4BF' }]}>
                      L {formatMonto(Number(deuda.monto_pagado))}
                    </Text>
                  </View>
                  <View style={styles.montoItem}>
                    <Text style={styles.montoLabel}>Pendiente</Text>
                    <Text style={[styles.montoValor, {
                      color: deuda.tipo === 'debo' ? '#F87171' : '#4ADE80'
                    }]}>
                      L {formatMonto(pendiente)}
                    </Text>
                  </View>
                </View>

                {/* Barra progreso */}
                <View style={styles.barraContainer}>
                  <View style={[styles.barra, { width: `${pct}%` as any }]} />
                </View>
                <View style={styles.barraFooter}>
                  <Text style={styles.barraText}>{Math.round(pct)}% pagado</Text>
                  {deuda.fecha_limite && (
                    <Text style={[styles.barraText, vencida && { color: '#F87171' }]}>
                      Vence: {new Date(deuda.fecha_limite + 'T12:00:00')
                        .toLocaleDateString('es-HN')}
                    </Text>
                  )}
                </View>
              </View>
            )
          })
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
  resumenRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  resumenCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  resumenLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  resumenMonto: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  resumenSub: { color: '#475569', fontSize: 11 },
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
  emptyText: { color: '#94A3B8', fontSize: 15, marginBottom: 4 },
  emptySub: { color: '#475569', fontSize: 13 },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  cardIcono: {
    width: 44, height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', 
  },
  cardNombre: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cardDesc: { color: '#64748B', fontSize: 12, marginTop: 2 },
  badgeCompletada: {
    backgroundColor: '#0A2020',
    borderWidth: 1,
    borderColor: '#0D9488',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeVencida: {
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#991B1B',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  montosRow: { flexDirection: 'row', marginBottom: 12 },
  montoItem: { flex: 1 },
  montoLabel: { color: '#64748B', fontSize: 11, marginBottom: 3 },
  montoValor: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  barraContainer: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barra: { height: 6, backgroundColor: '#0D9488', borderRadius: 3 },
  barraFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  barraText: { color: '#475569', fontSize: 11 },
})