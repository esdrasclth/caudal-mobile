import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

interface Props {
  transacciones: any[]
  mes: number
  año: number
}

const DIAS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

export default function CalendarioFinanciero({ transacciones, mes, año }: Props) {
  const hoy = new Date()

  // Agrupar transacciones por día
  const porDia: Record<number, { ingresos: number; gastos: number }> = {}
  transacciones.forEach(t => {
    const dia = new Date(t.fecha + 'T12:00:00').getDate()
    if (!porDia[dia]) porDia[dia] = { ingresos: 0, gastos: 0 }
    if (t.tipo === 'ingreso') porDia[dia].ingresos += Number(t.monto)
    else porDia[dia].gastos += Number(t.monto)
  })

  const formatK = (n: number) => {
    if (n === 0) return '0'
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return Math.round(n).toString()
  }

  // Primer día del mes (0=Dom, ajustar a Lun=0)
  const primerDia = new Date(año, mes - 1, 1).getDay()
  const offset = primerDia === 0 ? 6 : primerDia - 1
  const diasEnMes = new Date(año, mes, 0).getDate()

  const celdas: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1)
  ]

  // Rellenar hasta múltiplo de 7
  while (celdas.length % 7 !== 0) celdas.push(null)

  const semanas = []
  for (let i = 0; i < celdas.length; i += 7) {
    semanas.push(celdas.slice(i, i + 7))
  }

  const maxGasto = Math.max(...Object.values(porDia).map(d => d.gastos), 1)

  const getBgColor = (dia: number) => {
    const data = porDia[dia]
    if (!data || (data.gastos === 0 && data.ingresos === 0)) return '#1E293B'
    if (data.ingresos > 0 && data.gastos === 0) return '#166534'
    const intensidad = Math.min(data.gastos / maxGasto, 1)
    if (intensidad > 0.7) return '#1D4ED8'
    if (intensidad > 0.4) return '#2563EB'
    if (intensidad > 0.1) return '#3B82F6'
    return '#1E3A5F'
  }

  const esHoy = (dia: number) =>
    dia === hoy.getDate() && mes === hoy.getMonth() + 1 && año === hoy.getFullYear()

  const esFuturo = (dia: number) => {
    const fecha = new Date(año, mes - 1, dia)
    return fecha > hoy
  }

  return (
    <View style={styles.container}>
      {/* Header días */}
      <View style={styles.headerRow}>
        {DIAS.map(d => (
          <View key={d} style={styles.headerCell}>
            <Text style={styles.headerText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Semanas */}
      {semanas.map((semana, si) => (
        <View key={si} style={styles.semanaRow}>
          {semana.map((dia, di) => {
            if (!dia) return <View key={di} style={styles.celda} />
            const data = porDia[dia]
            const futuro = esFuturo(dia)
            const hoyDia = esHoy(dia)

            return (
              <View
                key={di}
                style={[
                  styles.celda,
                  styles.celdaActiva,
                  { backgroundColor: futuro ? '#0F172A' : getBgColor(dia) },
                  hoyDia && styles.celdaHoy,
                ]}
              >
                <Text style={[styles.celdaDia, futuro && { color: '#334155' }]}>
                  {dia}
                </Text>
                {!futuro && data && data.ingresos > 0 && (
                  <Text style={styles.celdaIngreso}>+{formatK(data.ingresos)}</Text>
                )}
                {!futuro && (
                  <Text style={[styles.celdaGasto, futuro && { color: '#334155' }]}>
                    {data ? formatK(data.gastos) : '0'}
                  </Text>
                )}
              </View>
            )
          })}
        </View>
      ))}

      {/* Leyenda */}
      <View style={styles.leyenda}>
        <View style={styles.leyendaItem}>
          <View style={[styles.leyendaDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.leyendaText}>Ingresos</Text>
        </View>
        <View style={styles.leyendaItem}>
          <View style={[styles.leyendaDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.leyendaText}>Gastos</Text>
        </View>
        <View style={styles.leyendaItem}>
          <View style={[styles.leyendaDot, { backgroundColor: '#1E293B' }]} />
          <Text style={styles.leyendaText}>Sin actividad</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  semanaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  celda: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 10,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  celdaActiva: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  celdaHoy: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  celdaDia: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  celdaIngreso: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '600',
  },
  celdaGasto: {
    color: '#E2E8F0',
    fontSize: 9,
  },
  leyenda: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leyendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  leyendaText: {
    color: '#64748B',
    fontSize: 12,
  },
})