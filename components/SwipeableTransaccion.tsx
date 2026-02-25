import { useRef } from 'react'
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, PanResponder, Dimensions
} from 'react-native'

interface Props {
    transaccion: any
    onEditar: () => void
    onEliminar: () => void
    swipeAbierto: React.MutableRefObject<any>
}

const SWIPE_THRESHOLD = 40

export default function SwipeableTransaccion({ transaccion, onEditar, onEliminar, swipeAbierto }: Props) {
    const translateX = useRef(new Animated.Value(0)).current
    const t = transaccion
    const esteAbierto = useRef(false)

    const formatMonto = (n: number) =>
        new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

    const cerrarauto = () => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
        }).start()
        esteAbierto.current = false
    }

    const abrir = () => {
        Animated.spring(translateX, {
            toValue: -160,
            useNativeDriver: true,
        }).start()
        esteAbierto.current = true
    }

    const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 20,
      onPanResponderGrant: () => {
        // Si hay otro abierto, cerrarlo
        if (swipeAbierto.current && swipeAbierto.current !== cerrarauto) {
          swipeAbierto.current()
        }
        swipeAbierto.current = cerrarauto
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0 && gesture.dx >= -160) {
          translateX.setValue(gesture.dx)
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -40) {
          abrir()
        } else {
          cerrar()
          swipeAbierto.current = null
        }
      },
    })
    ).current

    const cerrar = () => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
        }).start()
    }

    return (
        <View style={styles.container}>
            {/* Botones detrás */}
            <View style={styles.acciones}>
                <TouchableOpacity
                    style={styles.btnEditar}
                    onPress={() => { cerrar(); onEditar() }}
                >
                    <Text style={{ fontSize: 20 }}>✏️</Text>
                    <Text style={styles.btnLabel}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.btnEliminar}
                    onPress={() => { cerrar(); onEliminar() }}
                >
                    <Text style={{ fontSize: 20 }}>🗑️</Text>
                    <Text style={styles.btnLabel}>Eliminar</Text>
                </TouchableOpacity>
            </View>

            {/* Fila de transacción */}
            <Animated.View
                style={[styles.fila, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
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
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    acciones: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 160,
        flexDirection: 'row',
    },
    btnEditar: {
        flex: 1,
        backgroundColor: '#1D4ED8',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    btnEliminar: {
        flex: 1,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    btnLabel: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
        backgroundColor: '#0F172A',
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
})