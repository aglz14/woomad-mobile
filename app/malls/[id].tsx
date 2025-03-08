import { Redirect, useLocalSearchParams } from 'expo-router';

export default function MallRedirect() {
  const { id } = useLocalSearchParams();
  return <Redirect href={`/malls/${id}`} />;
}