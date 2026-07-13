import { useState, useEffect, useCallback } from 'react';
import { User, SharedLocation } from '../../types';
import { UserDatabase } from '../../services/db';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export const useGeolocation = (currentUser: User) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get freshest user privacy settings
  const user = UserDatabase.findById(currentUser.id) || currentUser;
  const showLocationSetting = user.privacy?.showLocation ?? true;
  const incognitoModeSetting = user.privacy?.incognitoMode ?? false;

  const isAllowed = showLocationSetting && !incognitoModeSetting;

  const fetchLocation = useCallback(async (): Promise<LocationData | null> => {
    // If the user has disabled location or is in Incognito mode, we respect that!
    if (!isAllowed) {
      setError('Aviso: Você está no modo privado ou modo Incógnito da Tribo. Habilite o compartilhamento nas configurações para continuar.');
      setLocation(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocalização não é suportada por este dispositivo.');
        setIsLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get human-readable location
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`
            );
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.municipality || 'Local Desconhecido';
            const road = data.address.road || '';
            const addressString = road ? `${road}, ${city}` : city;

            const locData: LocationData = {
              latitude,
              longitude,
              address: addressString,
            };

            setLocation(locData);
            resolve(locData);
          } catch (err) {
            console.error('Erro de geocodificação reversa:', err);
            // Fallback inside high-security zones
            const locData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: 'Coordenadas Seguras (Localização Obtida)',
            };
            setLocation(locData);
            resolve(locData);
          } finally {
            setIsLoading(false);
          }
        },
        (err) => {
          console.error('Erro de geolocalização:', err);
          let errMsg = 'Erro desconhecido ao obter localização.';
          if (err.code === err.PERMISSION_DENIED) {
            errMsg = 'Permissão de localização negada pelo navegador.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errMsg = 'Posição de localização indisponível.';
          } else if (err.code === err.TIMEOUT) {
            errMsg = 'Tempo limite de geolocalização atingido.';
          }
          setError(errMsg);
          setIsLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [isAllowed]);

  const share = useCallback(
    async (
      targetType: 'friends' | 'community',
      targetId?: string,
      statusText?: string
    ): Promise<boolean> => {
      // Respect privacy settings!
      if (!isAllowed) {
        setError('Sua localização não pode ser compartilhada no modo Incógnito / Privado.');
        return false;
      }

      const locData = await fetchLocation();
      if (!locData) return false;

      // Create new SharedLocation item
      const sharedLoc: SharedLocation = {
        id: Math.random().toString(36).substring(2, 11),
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        latitude: locData.latitude,
        longitude: locData.longitude,
        address: locData.address,
        timestamp: Date.now(),
        targetType,
        targetId,
        statusText,
        incognito: false,
      };

      UserDatabase.saveSharedLocation(sharedLoc);
      return true;
    },
    [currentUser, fetchLocation, isAllowed]
  );

  const deleteShared = useCallback((shareId: string) => {
    UserDatabase.deleteSharedLocation(shareId);
  }, []);

  return {
    location,
    isLoading,
    error,
    isAllowed,
    incognitoMode: incognitoModeSetting,
    showLocation: showLocationSetting,
    fetchLocation,
    share,
    deleteShared,
  };
};
