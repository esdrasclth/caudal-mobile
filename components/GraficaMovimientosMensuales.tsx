import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'

interface Props {
  ingresos: number
  gastos: number
}

const screenWidth = Dimensions.get('window').width

export default function GraficaMovimientosMensuales({ ingresos, gastos }: Props) {
  const saldo = ingresos - gastos

  const data = [
    { value: ingresos || 0, label: 'Ingresos', frontColor: '#10B981' },
    { value: gastos || 0, label: 'Gastos', frontColor: '#F43F5E' },
    { value: Math.abs(saldo) || 0, label: 'Saldo', frontColor: saldo >= 0 ? '#22C55E' : '#F97316' },
  ]

  const maxVal = Math.max(ingresos, gastos, Math.abs(saldo), 1)
  const chartWidth = screenWidth - 80

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

  return (
    <View>
      <BarChart
        key={`${ingresos}-${gastos}`}
        data={data}
        width={chartWidth}
        barWidth={60}
        spacing={24}
        roundedTop
        hideRules={false}
        rulesColor="rgba(255,255,255,0.08)"
        xAxisColor="rgba(255,255,255,0.1)"
        yAxisColor="rgba(255,255,255,0.1)"
        yAxisTextStyle={{ color: '#64748B', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 12 }}
        noOfSections={4}
        maxValue={maxVal * 1.2}
        height={220}
        isAnimated={false}
        disableScroll
        yAxisLabelWidth={60}
      />

      <View style={styles.valoresContainer}>
        <View style={styles.valorItem}>
          <Text style={styles.valorLabel}>Ingresos</Text>
          <Text style={[styles.valorNumero, { color: '#10B981' }]}>
            L {formatMonto(ingresos)}
          </Text>
        </View>
        <View style={styles.valorItem}>
          <Text style={styles.valorLabel}>Gastos</Text>
          <Text style={[styles.valorNumero, { color: '#F43F5E' }]}>
            L {formatMonto(gastos)}
          </Text>
        </View>
        <View style={styles.valorItem}>
          <Text style={styles.valorLabel}>Saldo</Text>
          <Text style={[styles.valorNumero, { color: saldo >= 0 ? '#22C55E' : '#F97316' }]}>
            {saldo >= 0 ? 'L ' : '-L '}{formatMonto(Math.abs(saldo))}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  valoresContainer: { marginTop: 12, gap: 6 },
  valorItem: { flexDirection: 'row', justifyContent: 'space-between' },
  valorLabel: { color: '#94A3B8', fontSize: 13 },
  valorNumero: { fontSize: 13, fontWeight: '600' },
})