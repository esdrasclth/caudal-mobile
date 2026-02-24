import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Text, View, ActivityIndicator } from 'react-native'
import { supabase } from './lib/supabase'
import LoginScreen from './screens/LoginScreen'
import DashboardScreen from './screens/DashboardScreen'
import TransaccionesScreen from './screens/TransaccionesScreen'
import PresupuestoScreen from './screens/PresupuestoScreen'
import CarterasScreen from './screens/CarterasScreen'
import MasScreen from './screens/MasScreen'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DeudasScreen from './screens/DeudasScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const Placeholder = ({ nombre }: { nombre: string }) => (
  <View style={{ flex: 1, backgroundColor: '#020817', alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: '#fff', fontSize: 20 }}>{nombre}</Text>
  </View>
)

function MasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MasMenu" component={MasScreen} />
      <Stack.Screen name="Deudas" component={DeudasScreen} />
    </Stack.Navigator>
  )
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#14B8A6',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Inicio" component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⊞</Text> }} />
      <Tab.Screen name="Movimientos" component={TransaccionesScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>↕</Text> }} />
      <Tab.Screen name="Presupuesto" component={PresupuestoScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>◎</Text> }} />
      <Tab.Screen name="Carteras" component={CarterasScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>◈</Text> }} />
      <Tab.Screen name="Más" component={MasStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⊕</Text> }} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020817', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>💧</Text>
        <ActivityIndicator color="#14B8A6" size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {session ? <TabNavigator /> : <LoginScreen onLogin={() => { }} />}
    </NavigationContainer>
  )
}