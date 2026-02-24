import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { PieChart } from 'react-native-gifted-charts'

interface Props {
  transacciones: any[]
  vista: 'gasto' | 'ingreso'
  onVistaChange: (v: 'gasto' | 'ingreso') => void
}

const COLORES = [
  '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444',
  '#10B981', '#EC4899', '#6366F1', '#14B8A6',
  '#F97316', '#A855F7', '#EAB308', '#3B82F6'
]

export default function GraficaPastel({ transacciones, vista, onVistaChange }: Props) {
  //const [vista, setVista] = useState<'gasto' | 'ingreso'>('gasto')
  const [selected, setSelected] = useState<string | null>(null)

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  const datos = useMemo(() => {
    const agrupado = transacciones
      .filter(t => t.tipo === vista)
      .reduce((acc: any[], t) => {
        const nombre = t.categories?.nombre || 'Sin categoría'
        const icono = t.categories?.icono || '💸'
        const existing = acc.find(a => a.key === nombre)

        if (existing) {
          existing.value += Number(t.monto)
        } else {
          acc.push({ key: nombre, nombre, icono, value: Number(t.monto) })
        }
        return acc
      }, [])
      .sort((a, b) => b.value - a.value)

    const totalTemp = agrupado.reduce((sum, d) => sum + d.value, 0)
    const threshold = totalTemp * 0.05

    const mayores = agrupado.filter(d => d.value >= threshold)
    const menores = agrupado.filter(d => d.value < threshold)

    if (menores.length > 0) {
      const sumaMenores = menores.reduce((s, d) => s + d.value, 0)
      mayores.push({
        key: 'Otros',
        nombre: 'Otros',
        icono: '📦',
        value: sumaMenores,
      })
    }

    return mayores.map((item, index) => ({
      ...item,
      color: COLORES[index % COLORES.length],
      focused: selected === item.key,
      onPress: () => setSelected(item.key),
    }))
  }, [transacciones, vista, selected])

  const total = datos.reduce((sum, d) => sum + d.value, 0)

  return (
    <View>
      {/* Toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            vista === 'gasto' && styles.toggleGasto
          ]}
          onPress={() => {
            onVistaChange('gasto')
            setSelected(null)
          }}
        >
          <Text style={[
            styles.toggleText,
            vista === 'gasto' && styles.toggleActive
          ]}>
            💸 Gastos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            vista === 'ingreso' && styles.toggleIngreso
          ]}
          onPress={() => {
            onVistaChange('ingreso')
            setSelected(null)
          }}
        >
          <Text style={[
            styles.toggleText,
            vista === 'ingreso' && styles.toggleActive
          ]}>
            💰 Ingresos
          </Text>
        </TouchableOpacity>
      </View>

      {datos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>📊</Text>
          <Text style={styles.emptyText}>
            Sin {vista === 'gasto' ? 'gastos' : 'ingresos'} este mes
          </Text>
        </View>
      ) : (
        <>
          {/* Gráfica */}
          <View style={styles.chartContainer}>
            <PieChart
              data={datos}
              donut
              focusOnPress
              innerRadius={85}
              radius={120}
              strokeWidth={2}
              strokeColor="#0F172A"
              backgroundColor="transparent"
              innerCircleColor="#0F172A"   // 🔥 elimina centro blanco
              showGradient
              gradientCenterColor="#111827"
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.centerLabel}>
                    Total {vista === 'gasto' ? 'Gastos' : 'Ingresos'}
                  </Text>
                  <Text style={styles.centerMonto}>
                    L {formatMonto(total)}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Leyenda */}
          <View style={styles.leyenda}>
            {datos.map((item, index) => (
              <View key={index} style={styles.leyendaItem}>
                <View style={styles.leyendaLeft}>
                  <View style={[
                    styles.leyendaDot,
                    { backgroundColor: item.color }
                  ]} />
                  <Text style={styles.leyendaIcono}>
                    {item.icono}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={styles.leyendaNombre}
                  >
                    {item.nombre}
                  </Text>
                </View>

                <View style={styles.leyendaRight}>
                  <Text style={styles.leyendaMonto}>
                    L {formatMonto(item.value)}
                  </Text>
                  <Text style={styles.leyendaPct}>
                    {Math.round((item.value / total) * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },

  toggleGasto: { backgroundColor: '#EF4444' },
  toggleIngreso: { backgroundColor: '#10B981' },

  toggleText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },

  toggleActive: {
    color: '#FFFFFF',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },

  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  centerLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 4,
  },

  centerMonto: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  leyenda: {
    gap: 8,
  },

  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  leyendaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  leyendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  leyendaIcono: {
    fontSize: 16,
  },

  leyendaNombre: {
    color: '#CBD5E1',
    fontSize: 14,
    flex: 1,
  },

  leyendaRight: {
    alignItems: 'flex-end',
  },

  leyendaMonto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  leyendaPct: {
    color: '#64748B',
    fontSize: 12,
  },
})