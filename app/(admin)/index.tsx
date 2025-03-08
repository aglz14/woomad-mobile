import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Building2, Store, Tag } from 'lucide-react-native';

export default function AdminScreen() {
  const menuItems = [
    {
      title: 'Plazas',
      description: 'Agregar y administrar plazas comerciales',
      icon: Building2,
      route: '/(admin)/malls',
    },
    {
      title: 'Negocios',
      description: 'Administrar listado de negocios',
      icon: Store,
      route: '/(admin)/stores',
    },
    {
      title: 'Promociones',
      description: 'Crear y editar promociones',
      icon: Tag,
      route: '/(admin)/promotions',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Panel de Administración</Text>
        <Text style={styles.subtitle}>Gestiona tu centro comercial</Text>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <Pressable
              key={item.title}
              style={styles.card}
              onPress={() => router.push(item.route)}>
              <item.icon size={32} color="#FF4B4B" />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 60,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
});