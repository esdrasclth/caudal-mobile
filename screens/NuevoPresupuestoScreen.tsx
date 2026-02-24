import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../lib/supabase'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NuevoPresupuesto({ visible, onClose, onSuccess }: Props) {
  const [categorias, setCategorias] = useState<any[]>([])
  const [categoriaId, setCategoriaId] = useState('')
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mesActual = new Date().getMonth() + 1
  const añoActual = new Date().getFullYear()
  const mesNombre = new Date().toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (visible) cargarCategorias()
  }, [visible])

  const cargarCategorias = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    // Solo categorías de gasto que no tienen presupuesto este mes
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', session.user.id)
      .in('tipo', ['gasto', 'ambos'])
      .order('nombre')

    const { data: budgets } = await supabase
      .from('budgets')
      .select('category_id')
      .eq('user_id', session.user.id)
      .eq('mes', mesActual)
      .eq('año', añoActual)

    const categoriasConPresupuesto = new Set((budgets || []).map(b => b.category_id))
    const disponibles = (cats || []).filter(c => !categoriasConPresupuesto.has(c.id))

    setCategorias(disponibles)
    if (disponibles.length > 0) setCategoriaId(disponibles[0].id)
  }

  const handleGuardar = async () => {
    if (!monto || !categoriaId) {
      setError('Completa todos los campos')
      return
    }

    const montoNum = parseFloat(monto)
    if (montoNum <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { error: err } = await supabase.from('budgets').insert({
      user_id: session.user.id,
      category_id: categoriaId,
      monto_limite: montoNum,
      mes: mesActual,
      año: añoActual,
    })

    if (err) {
      setError('Error al guardar')
      setLoading(false)
      return
    }

    setMonto('')
    setLoading(false)
    onSuccess()
    onClose()
  }

  const categoriaSeleccionada = categorias.find(c => c.id === categoriaId)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.titulo}>Nuevo presupuesto</Text>
            <TouchableOpacity onPress={handleGuardar} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#14B8A6" />
                : <Text style={styles.guardar}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            {/* Mes */}
            <View style={styles.mesCard}>
              <Text style={{ fontSize: 24 }}>📅</Text>
              <View>
                <Text style={styles.mesLabel}>Mes del presupuesto</Text>
                <Text style={styles.mesNombre}>{mesNombre}</Text>
              </View>
            </View>

            {/* Monto */}
            <View style={styles.montoContainer}>
              <Text style={styles.montoPrefix}>L</Text>
              <TextInput
                style={styles.montoInput}
                value={monto}
                onChangeText={setMonto}
                placeholder="0.00"
                placeholderTextColor="#334155"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <Text style={styles.montoHint}>Límite de gasto mensual</Text>

            {/* Categoría */}
            <View style={styles.campo}>
              <Text style={styles.label}>Categoría</Text>

              {categorias.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                  <Text style={styles.emptyText}>
                    Todas las categorías ya tienen presupuesto este mes
                  </Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {categorias.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategoriaId(cat.id)}
                      style={[styles.catBtn, categoriaId === cat.id && styles.catBtnActivo]}
                    >
                      <Text style={{ fontSize: 24 }}>{cat.icono}</Text>
                      <Text style={[styles.catLabel, categoriaId === cat.id && { color: '#14B8A6' }]}>
                        {cat.nombre}
                      </Text>
                      {categoriaId === cat.id && (
                        <View style={styles.catCheck}>
                          <Text style={{ color: '#14B8A6', fontSize: 10 }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Preview */}
            {categoriaSeleccionada && monto ? (
              <View style={styles.preview}>
                <Text style={styles.previewTitle}>Resumen</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Categoría</Text>
                  <Text style={styles.previewValue}>
                    {categoriaSeleccionada.icono} {categoriaSeleccionada.nombre}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Límite</Text>
                  <Text style={[styles.previewValue, { color: '#14B8A6' }]}>
                    L {new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(parseFloat(monto) || 0)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Mes</Text>
                  <Text style={styles.previewValue}>{mesNombre}</Text>
                </View>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Botón */}
            <TouchableOpacity
              style={[styles.btnGuardar, categorias.length === 0 && { opacity: 0.5 }]}
              onPress={handleGuardar}
              disabled={loading || categorias.length === 0}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnGuardarText}>◎ Crear presupuesto</Text>
              }
            </TouchableOpacity>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  cancelar: { color: '#64748B', fontSize: 16 },
  titulo: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  guardar: { color: '#14B8A6', fontSize: 16, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 60 },
  mesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mesLabel: { color: '#64748B', fontSize: 12, marginBottom: 2 },
  mesNombre: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  montoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#0D9488',
    paddingBottom: 16,
    marginBottom: 8,
  },
  montoPrefix: { color: '#0D9488', fontSize: 36, fontWeight: 'bold' },
  montoInput: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: 'bold',
    minWidth: 120,
    textAlign: 'center',
  },
  montoHint: { color: '#475569', fontSize: 12, textAlign: 'center', marginBottom: 24 },
  campo: { marginBottom: 20 },
  label: { color: '#94A3B8', fontSize: 13, fontWeight: '500', marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    width: '30%',
    gap: 4,
    position: 'relative',
  },
  catBtnActivo: { borderColor: '#0D9488', backgroundColor: '#0A2020' },
  catLabel: { color: '#94A3B8', fontSize: 11, textAlign: 'center' },
  catCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    backgroundColor: '#0D9488',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  previewTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  previewLabel: { color: '#64748B', fontSize: 14 },
  previewValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: '#64748B', fontSize: 13, textAlign: 'center' },
  errorBox: {
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#991B1B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#FCA5A5', fontSize: 13 },
  btnGuardar: {
    backgroundColor: '#0D9488',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnGuardarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})