import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { supabase } from '../lib/supabase'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NuevaTransaccion({ visible, onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState<'gasto' | 'ingreso' | 'transferencia'>('gasto')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(new Date())
  const [mostrarFecha, setMostrarFecha] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [categoriaId, setCategoriaId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [walletDestinoId, setWalletDestinoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (visible) cargarDatos()
  }, [visible])

  const cargarDatos = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', session.user.id)
      .order('nombre')

    const { data: ws } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('activo', true)

    setCategorias(cats || [])
    setWallets(ws || [])
    if (ws && ws.length > 0) {
      setWalletId(ws[0].id)
      setWalletDestinoId(ws.length > 1 ? ws[1].id : ws[0].id)
    }
    if (cats && cats.length > 0) setCategoriaId(cats[0].id)
  }

  const categoriasFiltradas = categorias.filter(c =>
    c.tipo === tipo || c.tipo === 'ambos'
  )

  const formatFecha = (d: Date) =>
    d.toLocaleDateString('es-HN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

  const handleGuardar = async () => {
    if (!monto) { setError('Ingresa un monto'); return }
    if (tipo !== 'transferencia' && !categoriaId) { setError('Selecciona una categoría'); return }
    if (!walletId) { setError('Selecciona una cartera'); return }
    if (tipo === 'transferencia' && walletId === walletDestinoId) {
      setError('Las carteras deben ser diferentes')
      return
    }

    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const fechaStr = fecha.toISOString().split('T')[0]

    if (tipo === 'transferencia') {
      // Gasto en cartera origen
      await supabase.from('transactions').insert({
        user_id: session.user.id,
        tipo: 'gasto',
        monto: parseFloat(monto),
        descripcion: descripcion || 'Transferencia',
        category_id: categoriaId || null,
        wallet_id: walletId,
        wallet_destino_id: walletDestinoId,
        fecha: fechaStr,
      })
      // Ingreso en cartera destino
      await supabase.from('transactions').insert({
        user_id: session.user.id,
        tipo: 'ingreso',
        monto: parseFloat(monto),
        descripcion: descripcion || 'Transferencia',
        category_id: categoriaId || null,
        wallet_id: walletDestinoId,
        fecha: fechaStr,
      })
    } else {
      const { error: err } = await supabase.from('transactions').insert({
        user_id: session.user.id,
        tipo,
        monto: parseFloat(monto),
        descripcion,
        category_id: categoriaId,
        wallet_id: walletId,
        fecha: fechaStr,
      })
      if (err) { setError('Error al guardar'); setLoading(false); return }
    }

    setMonto('')
    setDescripcion('')
    setFecha(new Date())
    setLoading(false)
    onSuccess()
    onClose()
  }

  const TIPOS = [
    { valor: 'gasto', label: '💸 Gasto', color: '#EF4444', bg: '#450A0A' },
    { valor: 'ingreso', label: '💰 Ingreso', color: '#10B981', bg: '#052E16' },
    { valor: 'transferencia', label: '↔️ Transferencia', color: '#6366F1', bg: '#1E1B4B' },
  ]

  const tipoActual = TIPOS.find(t => t.valor === tipo)!

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
            <Text style={styles.titulo}>Nueva transacción</Text>
            <TouchableOpacity onPress={handleGuardar} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#14B8A6" />
                : <Text style={styles.guardar}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            {/* Toggle tipo */}
            <View style={styles.toggleContainer}>
              {TIPOS.map(t => (
                <TouchableOpacity
                  key={t.valor}
                  style={[styles.toggleBtn, tipo === t.valor && { backgroundColor: t.bg, borderColor: t.color }]}
                  onPress={() => setTipo(t.valor as any)}
                >
                  <Text style={[styles.toggleText, tipo === t.valor && { color: t.color }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Monto */}
            <View style={[styles.montoContainer, { borderColor: tipoActual.color + '40' }]}>
              <Text style={[styles.montoPrefix, { color: tipoActual.color }]}>L</Text>
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

            {/* Descripcion */}
            <View style={styles.campo}>
              <Text style={styles.label}>Descripción <Text style={styles.opcional}>(opcional)</Text></Text>
              <TextInput
                style={styles.input}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Ej: Almuerzo, salario..."
                placeholderTextColor="#475569"
              />
            </View>

            {/* Categoría — solo si no es transferencia */}
            {tipo !== 'transferencia' && (
              <View style={styles.campo}>
                <Text style={styles.label}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20 }}>
                    {categoriasFiltradas.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setCategoriaId(cat.id)}
                        style={[styles.catBtn, categoriaId === cat.id && styles.catBtnActivo]}
                      >
                        <Text style={{ fontSize: 22 }}>{cat.icono}</Text>
                        <Text style={[styles.catLabel, categoriaId === cat.id && { color: '#14B8A6' }]}>
                          {cat.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Cartera origen */}
            <View style={styles.campo}>
              <Text style={styles.label}>
                {tipo === 'transferencia' ? 'Cartera origen' : 'Cartera'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20 }}>
                  {wallets.map(w => (
                    <TouchableOpacity
                      key={w.id}
                      onPress={() => setWalletId(w.id)}
                      style={[styles.catBtn, walletId === w.id && styles.catBtnActivo]}
                    >
                      <Text style={{ fontSize: 22 }}>
                        {w.tipo === 'credito' ? '💳' : w.tipo === 'ahorro' ? '🏦' : '👛'}
                      </Text>
                      <Text style={[styles.catLabel, walletId === w.id && { color: '#14B8A6' }]}>
                        {w.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Cartera destino — solo transferencia */}
            {tipo === 'transferencia' && (
              <View style={styles.campo}>
                <Text style={styles.label}>Cartera destino</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20 }}>
                    {wallets.filter(w => w.id !== walletId).map(w => (
                      <TouchableOpacity
                        key={w.id}
                        onPress={() => setWalletDestinoId(w.id)}
                        style={[styles.catBtn, walletDestinoId === w.id && styles.catBtnActivo]}
                      >
                        <Text style={{ fontSize: 22 }}>
                          {w.tipo === 'credito' ? '💳' : w.tipo === 'ahorro' ? '🏦' : '👛'}
                        </Text>
                        <Text style={[styles.catLabel, walletDestinoId === w.id && { color: '#14B8A6' }]}>
                          {w.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Fecha */}
            <View style={styles.campo}>
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity
                style={styles.fechaBtn}
                onPress={() => setMostrarFecha(true)}
              >
                <Text style={{ fontSize: 18 }}>📅</Text>
                <Text style={styles.fechaText}>{formatFecha(fecha)}</Text>
              </TouchableOpacity>
            </View>

            {/* Modal del calendario */}
            <Modal
              visible={mostrarFecha}
              transparent
              animationType="slide"
              onRequestClose={() => setMostrarFecha(false)}
            >
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#00000080' }}
                onPress={() => setMostrarFecha(false)}
              />
              <View style={{
                backgroundColor: '#1E293B',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 15 }}>Selecciona la fecha</Text>
                  <TouchableOpacity onPress={() => setMostrarFecha(false)}>
                    <Text style={{ color: '#14B8A6', fontSize: 15, fontWeight: '600' }}>Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={fecha}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setFecha(selectedDate)
                  }}
                  maximumDate={new Date()}
                  themeVariant="dark"
                  style={{ height: 180 }}
                />
              </View>
            </Modal>

            {/* Botón guardar */}
            <TouchableOpacity
              style={[styles.btnGuardar, { backgroundColor: tipoActual.color }]}
              onPress={handleGuardar}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnGuardarText}>
                  {tipo === 'gasto' ? '💸 Registrar gasto'
                    : tipo === 'ingreso' ? '💰 Registrar ingreso'
                      : '↔️ Registrar transferencia'}
                </Text>
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
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleText: { color: '#64748B', fontWeight: '600', fontSize: 12 },
  montoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
    borderBottomWidth: 2,
    paddingBottom: 16,
  },
  montoPrefix: { fontSize: 36, fontWeight: 'bold' },
  montoInput: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: 'bold',
    minWidth: 120,
    textAlign: 'center',
  },
  campo: { marginBottom: 20 },
  label: { color: '#94A3B8', fontSize: 13, fontWeight: '500', marginBottom: 10 },
  opcional: { color: '#475569', fontWeight: '400' },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  catBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 76,
    gap: 4,
  },
  catBtnActivo: { borderColor: '#0D9488', backgroundColor: '#0A2020' },
  catLabel: { color: '#94A3B8', fontSize: 11, textAlign: 'center' },
  fechaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
  },
  fechaText: { color: '#FFFFFF', fontSize: 15, textTransform: 'capitalize' },
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
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnGuardarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})