import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Building2, Store, Tag, ArrowLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

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
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Panel de Administración</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>Gestiona tu centro comercial</Text>

          <View style={styles.grid}>
            {menuItems.map((item) => (
              <Pressable
                key={item.title}
                style={styles.card}
                onPress={() => router.push(item.route as any)}
              >
                <item.icon size={32} color="#FF4B4B" />
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
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
