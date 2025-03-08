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
        <Text style={styles.headerTitle}>Política de Privacidad</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          Política de Privacidad para la Aplicación Móvil de Promociones en
          Centros Comerciales
        </Text>
        <Text style={styles.date}>
          Última actualización: 8 de marzo de 2025
        </Text>

        <Text style={styles.paragraph}>
          En Woomad nos comprometemos a proteger la privacidad de nuestros
          usuarios. Esta política de privacidad describe cómo recopilamos,
          usamos, almacenamos y compartimos tu información personal cuando usas
          nuestra aplicación móvil que te proporciona promociones de negocios en
          centros comerciales cercanos a tu ubicación.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            1. Información que Recopilamos
          </Text>
          <Text style={styles.paragraph}>
            Recopilamos varios tipos de información para proporcionarte una
            experiencia personalizada y para mejorar nuestros servicios. La
            información que podemos recopilar incluye:
          </Text>

          <Text style={styles.subSectionTitle}>
            a. Información Personal Identificable
          </Text>
          <Text style={styles.listItem}>
            • Datos de contacto: nombre, correo electrónico, número de teléfono,
            etc., cuando te registras o usas algunas de las funcionalidades de
            la aplicación.
          </Text>
          <Text style={styles.listItem}>
            • Información de cuenta: contraseñas y preferencias de usuario que
            se almacenan para tu acceso a la cuenta.
          </Text>

          <Text style={styles.subSectionTitle}>
            b. Información de Ubicación
          </Text>
          <Text style={styles.listItem}>
            • Ubicación precisa: Accedemos a tu ubicación en tiempo real para
            proporcionarte promociones basadas en los centros comerciales
            cercanos a tu ubicación. Esta información solo será utilizada para
            mostrarte las ofertas relevantes y no será almacenada
            permanentemente sin tu consentimiento.
          </Text>

          <Text style={styles.subSectionTitle}>
            c. Información de Dispositivo
          </Text>
          <Text style={styles.listItem}>
            • Información técnica: Datos sobre el dispositivo móvil que usas
            (tipo de dispositivo, sistema operativo, identificadores únicos,
            etc.).
          </Text>
          <Text style={styles.listItem}>
            • Datos de uso: Información sobre cómo interactúas con la
            aplicación, como las funcionalidades que usas y la duración de tu
            sesión.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Uso de la Información</Text>
          <Text style={styles.paragraph}>
            Usamos la información recopilada para los siguientes fines:
          </Text>
          <Text style={styles.listItem}>
            • Proporcionar promociones personalizadas: Mostrarte ofertas y
            descuentos de negocios en centros comerciales cercanos a tu
            ubicación.
          </Text>
          <Text style={styles.listItem}>
            • Mejorar la experiencia de usuario: Mejorar y personalizar nuestra
            aplicación para que sea más relevante para ti.
          </Text>
          <Text style={styles.listItem}>
            • Comunicación contigo: Enviarte notificaciones sobre nuevas
            promociones, actualizaciones de la aplicación y otros avisos
            importantes.
          </Text>
          <Text style={styles.listItem}>
            • Seguridad y análisis: Utilizar tus datos de uso para prevenir
            fraudes y realizar análisis que mejoren el funcionamiento de la
            aplicación.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Uso de la Información de Ubicación
          </Text>
          <Text style={styles.paragraph}>
            Tu ubicación es fundamental para mostrarte promociones cercanas. Sin
            embargo, solo recopilamos esta información cuando la aplicación está
            en uso y con tu consentimiento explícito. Puedes desactivar la
            recopilación de tu ubicación en cualquier momento a través de la
            configuración de tu dispositivo, pero esto puede limitar algunas
            funcionalidades de la aplicación.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            4. Compartición de Información
          </Text>
          <Text style={styles.paragraph}>
            No vendemos, alquilamos ni compartimos tu información personal con
            terceros, excepto en las siguientes circunstancias:
          </Text>
          <Text style={styles.listItem}>
            • Proveedores de servicios: Podemos compartir información con
            terceros que nos proporcionen servicios necesarios para el
            funcionamiento de la aplicación (por ejemplo, servicios de hosting o
            análisis de datos), quienes estarán sujetos a las mismas
            obligaciones de privacidad que esta política.
          </Text>
          <Text style={styles.listItem}>
            • Requerimientos legales: Podemos compartir tu información si es
            necesario para cumplir con una obligación legal, una orden judicial,
            o para proteger nuestros derechos legales o los de otros usuarios.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            5. Seguridad de la Información
          </Text>
          <Text style={styles.paragraph}>
            Tomamos medidas razonables para proteger tu información personal
            contra pérdida, robo, uso indebido y acceso no autorizado. Sin
            embargo, no podemos garantizar la seguridad absoluta de los datos
            transmitidos a través de la aplicación.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Derechos del Usuario</Text>
          <Text style={styles.paragraph}>
            De acuerdo con la Ley Federal de Protección de Datos Personales en
            Posesión de los Particulares en México, tienes los siguientes
            derechos:
          </Text>
          <Text style={styles.listItem}>
            • Acceso: Puedes solicitar información sobre los datos personales
            que tenemos sobre ti.
          </Text>
          <Text style={styles.listItem}>
            • Rectificación: Puedes corregir datos personales incorrectos o
            incompletos.
          </Text>
          <Text style={styles.listItem}>
            • Cancelación: Puedes solicitar la eliminación de tus datos
            personales.
          </Text>
          <Text style={styles.listItem}>
            • Oposición: Puedes oponerte al tratamiento de tus datos para fines
            específicos.
          </Text>
          <Text style={styles.paragraph}>
            Para ejercer cualquiera de estos derechos, por favor, comunícate con
            nosotros a través de la siguiente dirección de correo electrónico:
            info@woomad.com.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            7. Cookies y Tecnologías Similares
          </Text>
          <Text style={styles.paragraph}>
            La aplicación puede utilizar cookies y tecnologías similares para
            mejorar la experiencia del usuario. Las cookies son pequeños
            archivos que se almacenan en tu dispositivo y nos ayudan a
            recordarte y personalizar tu experiencia en la aplicación.
          </Text>
          <Text style={styles.paragraph}>
            Puedes configurar tu dispositivo para que te avise cuando se
            utilicen cookies o para bloquearlas, pero algunas funcionalidades de
            la aplicación pueden no estar disponibles si desactivas las cookies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            8. Cambios a esta Política de Privacidad
          </Text>
          <Text style={styles.paragraph}>
            Nos reservamos el derecho de modificar esta política de privacidad
            en cualquier momento. Cualquier cambio será publicado en esta página
            con la fecha de la última actualización. Te recomendamos revisar
            periódicamente esta política para estar informado sobre cómo
            protegemos tu información.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contacta con Nosotros</Text>
          <Text style={styles.paragraph}>
            Si tienes alguna pregunta sobre esta política de privacidad o sobre
            cómo manejamos tus datos personales, no dudes en contactarnos en:
          </Text>
          <Text style={styles.paragraph}>
            Correo electrónico: info@woomad.com
          </Text>
          <Text style={styles.paragraph}>
            Esta Política de Privacidad está sujeta a las leyes y regulaciones
            aplicables en México, en especial la Ley Federal de Protección de
            Datos Personales en Posesión de los Particulares y su reglamento.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Woomad. Todos los derechos reservados.
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
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
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
    color: '#333333',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 12,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 8,
    paddingLeft: 16,
  },
  footer: {
    marginTop: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
  },
});
