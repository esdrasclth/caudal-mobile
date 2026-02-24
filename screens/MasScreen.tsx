import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'

const MENU_ITEMS = [
  {
    grupo: 'Finanzas',
    items: [
      { icono: '🤝', label: 'Deudas y préstamos', pantalla: 'Deudas' },
      { icono: '📊', label: 'Reportes', pantalla: 'Reportes' },
      { icono: '📄', label: 'Exportar datos', pantalla: 'Exportar' },
    ]
  },
  {
    grupo: 'Organización',
    items: [
      { icono: '🏷️', label: 'Categorías', pantalla: 'Categorias' },
    ]
  },
  {
    grupo: 'Cuenta',
    items: [
      { icono: '⚙️', label: 'Configuración', pantalla: 'Perfil' },
    ]
  },
]

export default function MasScreen() {
  const navigation = useNavigation<any>()

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
          }
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Más opciones</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {MENU_ITEMS.map(grupo => (
          <View key={grupo.grupo} style={{ marginBottom: 24 }}>
            <Text style={styles.grupoLabel}>{grupo.grupo}</Text>
            <View style={styles.grupo}>
              {grupo.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.item,
                    idx < grupo.items.length - 1 && styles.itemBorder
                  ]}
                  onPress={() => navigation.navigate(item.pantalla)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.itemIcono}>
                      <Text style={{ fontSize: 20 }}>{item.icono}</Text>
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.itemFlecha}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Cerrar sesión */}
        <View style={styles.grupo}>
          <TouchableOpacity
            style={styles.item}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcono, { backgroundColor: '#450A0A' }]}>
                <Text style={{ fontSize: 20 }}>⎋</Text>
              </View>
              <Text style={[styles.itemLabel, { color: '#F87171' }]}>Cerrar sesión</Text>
            </View>
            <Text style={[styles.itemFlecha, { color: '#F87171' }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>Caudal v1.0.0 · Hecho para Centroamérica 💧</Text>

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
  grupoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grupo: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemIcono: {
    width: 40,
    height: 40,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  itemFlecha: {
    color: '#334155',
    fontSize: 24,
    fontWeight: '300',
  },
  version: {
    color: '#334155',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
})