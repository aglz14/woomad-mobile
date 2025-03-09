import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Aviso de Privacidad</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Aviso de Privacidad</Text>
        <Text style={styles.date}>
          Fecha de última actualización: 8 de marzo de 2025
        </Text>

        <Text style={styles.paragraph}>
          En Woomad (en adelante "la Aplicación"), respetamos tu privacidad y
          estamos comprometidos a proteger los datos personales que compartes
          con nosotros. El presente Aviso de Privacidad tiene como objetivo
          informarte sobre cómo recolectamos, usamos, almacenamos y protegemos
          tu información personal, así como los derechos que tienes sobre tus
          datos.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Información que recabamos</Text>
          <Text style={styles.paragraph}>
            La Aplicación recaba la siguiente información personal:
          </Text>

          <Text style={styles.listItem}>
            • Datos proporcionados por el usuario: Cuando te registras en la
            Aplicación o haces uso de ciertas funcionalidades, podemos
            solicitarte que nos proporciones información personal como tu
            nombre, correo electrónico, y contraseña.
          </Text>
          <Text style={styles.listItem}>
            • Datos de ubicación: Con el fin de mostrarte promociones cercanas a
            tu ubicación, recolectamos tu ubicación geográfica de manera
            anónima. La información de ubicación solo se utilizará para
            ofrecerte un mejor servicio.
          </Text>
          <Text style={styles.listItem}>
            • Datos de uso de la aplicación: Recolectamos información
            relacionada con tu uso de la Aplicación, tales como las promociones
            que visualizas o las interacciones que realizas dentro de la
            plataforma.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Uso de los datos</Text>
          <Text style={styles.paragraph}>
            La información que recopilamos se utiliza para los siguientes fines:
          </Text>
          <Text style={styles.listItem}>
            • Proporcionar y mejorar la experiencia de la Aplicación, incluyendo
            la personalización de las promociones basadas en tu ubicación.
          </Text>
          <Text style={styles.listItem}>
            • Enviar notificaciones relacionadas con las promociones y
            actualizaciones de la Aplicación.
          </Text>
          <Text style={styles.listItem}>
            • Analizar el uso de la Aplicación con fines estadísticos para
            mejorar su funcionamiento.
          </Text>
          <Text style={styles.listItem}>
            • Cumplir con las obligaciones legales y fiscales relacionadas con
            el uso de la Aplicación.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Servicios de terceros</Text>
          <Text style={styles.paragraph}>
            La Aplicación utiliza servicios de terceros para almacenar y
            gestionar los datos, específicamente Supabase, que es un servicio
            que nos permite manejar la base de datos y la autenticación de
            usuarios. Estos proveedores de servicios están sujetos a sus propias
            políticas de privacidad, y solo accederán a los datos de los
            usuarios según sea necesario para brindar los servicios. No
            compartimos tus datos con terceros para fines de marketing sin tu
            consentimiento.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Conservación de datos</Text>
          <Text style={styles.paragraph}>
            Tus datos serán almacenados mientras tengas una cuenta activa en la
            Aplicación y por el tiempo necesario para cumplir con los fines
            descritos en este Aviso de Privacidad. En caso de que decidas
            eliminar tu cuenta, tus datos serán eliminados conforme a las
            políticas de Supabase y según lo que se indica en el siguiente
            apartado.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Derechos de los usuarios</Text>
          <Text style={styles.paragraph}>
            Tienes derecho a acceder, rectificar, cancelar u oponerte al
            tratamiento de tus datos personales. Si deseas ejercer cualquiera de
            estos derechos o solicitar la eliminación de tu cuenta, por favor
            contacta con nosotros a través del siguiente correo electrónico:
            info@woomad.com.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Eliminar tus datos</Text>
          <Text style={styles.paragraph}>
            Si deseas eliminar tu cuenta y todos los datos asociados, puedes
            hacerlo de las siguientes maneras:
          </Text>
          <Text style={styles.listItem}>
            • A través de correo electrónico: Envía una solicitud de eliminación
            de datos a info@woomad.com, y procederemos con la eliminación de tu
            cuenta y datos asociados.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Seguridad de los datos</Text>
          <Text style={styles.paragraph}>
            Implementamos medidas de seguridad razonables para proteger tus
            datos personales, sin embargo, ningún sistema de seguridad es
            infalible. No podemos garantizar la seguridad absoluta de la
            información, aunque trabajamos continuamente para mejorar nuestras
            protecciones.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            8. Modificaciones al Aviso de Privacidad
          </Text>
          <Text style={styles.paragraph}>
            Nos reservamos el derecho de modificar este Aviso de Privacidad en
            cualquier momento. Cualquier cambio será notificado a través de la
            Aplicación o por correo electrónico. Te recomendamos revisar
            periódicamente este Aviso de Privacidad para estar al tanto de
            cualquier modificación.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contacto</Text>
          <Text style={styles.paragraph}>
            Si tienes preguntas o comentarios sobre este Aviso de Privacidad, o
            si deseas ejercer cualquiera de tus derechos en relación con tus
            datos personales, puedes contactarnos en info@woomad.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
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
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 16,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 8,
    paddingLeft: 16,
  },
});
