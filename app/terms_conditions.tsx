import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function TermsConditionsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>TÉRMINOS Y CONDICIONES DE USO</Text>
        <Text style={styles.date}>
          Fecha de última actualización: 8 de marzo de 2025
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ACEPTACIÓN DE LOS TÉRMINOS</Text>
          <Text style={styles.paragraph}>
            Al acceder, utilizar o descargar la aplicación móvil Woomad (en
            adelante "la Aplicación"), el usuario (en adelante "el Usuario")
            acepta cumplir con estos Términos y Condiciones de Uso (en adelante
            "los Términos"). Si el Usuario no está de acuerdo con estos
            Términos, deberá abstenerse de utilizar la Aplicación.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. DESCRIPCIÓN DE LA APLICACIÓN
          </Text>
          <Text style={styles.paragraph}>
            La Aplicación es una plataforma digital que permite al Usuario
            acceder a promociones y descuentos de negocios ubicados en centros
            comerciales cercanos a su ubicación. La Aplicación ofrece un
            servicio de localización y notificaciones en tiempo real sobre
            ofertas disponibles, permitiendo que el Usuario se beneficie de las
            promociones de manera sencilla.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. USO DE LA APLICACIÓN</Text>
          <Text style={styles.paragraph}>
            El Usuario se compromete a usar la Aplicación únicamente para fines
            legales y conforme a estos Términos. El Usuario no podrá:
          </Text>
          <Text style={styles.listItem}>
            • Utilizar la Aplicación de manera que interfiera con su correcto
            funcionamiento.
          </Text>
          <Text style={styles.listItem}>
            • Modificar, adaptar o hackear la Aplicación.
          </Text>
          <Text style={styles.listItem}>
            • Violar derechos de propiedad intelectual o los derechos de
            privacidad de otros Usuarios.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            4. REGISTRO Y CUENTA DE USUARIO
          </Text>
          <Text style={styles.paragraph}>
            Para acceder a ciertos servicios de la Aplicación, el Usuario deberá
            registrarse proporcionando información personal verídica y
            actualizada. El Usuario es responsable de mantener la
            confidencialidad de su cuenta y contraseña.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. PROMOCIONES Y DESCUENTOS</Text>
          <Text style={styles.paragraph}>
            La Aplicación ofrece promociones y descuentos proporcionados por los
            comercios asociados. Estas ofertas están sujetas a cambios sin
            previo aviso y dependen de la disponibilidad de los comercios
            participantes. La Aplicación no es responsable de la validez o
            cumplimiento de las promociones ofrecidas por los comercios.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            6. PRIVACIDAD Y PROTECCIÓN DE DATOS PERSONALES
          </Text>
          <Text style={styles.paragraph}>
            El tratamiento de los datos personales del Usuario se realiza
            conforme a nuestra Política de Privacidad, que está disponible en la
            Aplicación. El Usuario autoriza el uso de sus datos personales para
            las finalidades descritas en dicha política, incluyendo la
            localización para personalizar las promociones ofrecidas.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            7. GEOLOCALIZACIÓN Y NOTIFICACIONES
          </Text>
          <Text style={styles.paragraph}>
            La Aplicación utiliza servicios de geolocalización para identificar
            la ubicación del Usuario y ofrecer promociones cercanas. El Usuario
            podrá desactivar esta función en cualquier momento desde los ajustes
            de su dispositivo móvil.
          </Text>
          <Text style={styles.paragraph}>
            La Aplicación también enviará notificaciones push sobre nuevas
            promociones, descuentos y ofertas. El Usuario podrá gestionar las
            notificaciones desde los ajustes de su dispositivo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. DERECHOS DE PROPIEDAD</Text>
          <Text style={styles.paragraph}>
            La Aplicación, su diseño, contenido, logotipos, marcas comerciales y
            demás elementos relacionados son propiedad exclusiva de Woomad o de
            sus licenciatarios. El Usuario no podrá reproducir, distribuir ni
            utilizar estos elementos sin el permiso expreso y por escrito de los
            titulares de los derechos correspondientes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            9. LIMITACIÓN DE RESPONSABILIDAD
          </Text>
          <Text style={styles.paragraph}>
            La Aplicación no garantiza la disponibilidad continua o la exactitud
            de las promociones. El Usuario reconoce y acepta que las promociones
            y descuentos dependen de los comercios participantes y que estos
            pueden cambiar o cancelarse sin previo aviso.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. TERMINACIÓN DE LA CUENTA</Text>
          <Text style={styles.paragraph}>
            El Usuario puede desactivar su cuenta en cualquier momento desde la
            Aplicación. Woomad se reserva el derecho de suspender o cancelar la
            cuenta de un Usuario si se detecta el incumplimiento de estos
            Términos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            11. MODIFICACIONES A LOS TÉRMINOS
          </Text>
          <Text style={styles.paragraph}>
            Woomad se reserva el derecho de modificar estos Términos en
            cualquier momento. Cualquier modificación será publicada en la
            Aplicación y entrará en vigor inmediatamente después de su
            publicación. El uso continuado de la Aplicación después de los
            cambios implica la aceptación de los nuevos Términos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            12. LEY APLICABLE Y JURISDICCIÓN
          </Text>
          <Text style={styles.paragraph}>
            Estos Términos se regirán e interpretarán de acuerdo con las leyes
            de los Estados Unidos Mexicanos. En caso de cualquier controversia,
            las partes se someten a la jurisdicción de los tribunales
            competentes de Monterrey, México.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. CONTACTO</Text>
          <Text style={styles.paragraph}>
            Si el Usuario tiene alguna pregunta o comentario sobre estos
            Términos, puede ponerse en contacto con nosotros a través de la
            siguiente dirección de correo electrónico: info@woomad.com
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
