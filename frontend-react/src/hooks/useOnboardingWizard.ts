import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useCategories } from './useCategories';
import api, { getErrorMessage } from '../services/api';

// 4 pasos: Datos personales (con saludo), Ubicación, Info profesional
// (tutores), Intereses — sin un paso de "Bienvenida" separado que no
// recolecta nada, para no exceder el máximo de 4 pasos por flujo.
export type OnboardingStep = 1 | 2 | 3 | 4;

export interface OnboardingData {
  // Paso 1: datos comunes
  phone: string;
  gender: 'M' | 'F' | 'other' | '';
  // Paso 2: dirección
  street: string;
  coords: { lat: number; lng: number };
  // Paso 3: solo tutores
  bio: string;
  cvUrl: string;
  portfolioUrl: string;
  baseRate: number;
  ratePerKm: number;
  // Paso 4: categorías
  categoryIds: string[];
}

const GUATEMALA_CENTER = { lat: 14.6349, lng: -90.5069 };

const INITIAL_DATA: OnboardingData = {
  phone: '',
  gender: '',
  street: '',
  coords: GUATEMALA_CENTER,
  bio: '',
  cvUrl: '',
  portfolioUrl: '',
  baseRate: 100,
  ratePerKm: 5,
  categoryIds: [],
};

interface OnboardingPayload {
  phone: string;
  gender: OnboardingData['gender'];
  address: { street: string; coords: { lat: number; lng: number } };
  categoryIds: string[];
  bio?: string;
  cvUrl?: string;
  portfolioUrl?: string;
  baseRate?: number;
  ratePerKm?: number;
  categories?: string[];
}

interface UseOnboardingWizardResult {
  step: OnboardingStep;
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
  categories: ReturnType<typeof useCategories>['categories'];
  error: string | null;
  isLoading: boolean;
  handleNext: () => Promise<void>;
  handleBack: () => void;
  isTutor: boolean;
}

export const useOnboardingWizard = (): UseOnboardingWizardResult => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  const isTutor = user?.role === 'tutor';

  const update = <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async () => {
    setIsLoading(true);
    try {
      const payload: OnboardingPayload = {
        phone: data.phone,
        gender: data.gender,
        address: { street: data.street, coords: data.coords },
        categoryIds: data.categoryIds,
      };
      if (isTutor) {
        payload.bio = data.bio;
        payload.cvUrl = data.cvUrl;
        payload.portfolioUrl = data.portfolioUrl || undefined;
        payload.baseRate = data.baseRate;
        payload.ratePerKm = data.ratePerKm;
        payload.categories = data.categoryIds;
      }

      await api.put('/users/me/onboarding', payload);
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el perfil.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    setError(null);
    if (step === 1) {
      if (!data.phone.trim()) { setError('Ingrese su número de teléfono.'); return; }
      if (!data.gender) { setError('Seleccione su género.'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!data.street.trim()) { setError('Ingrese una descripción de su dirección.'); return; }
      setStep(isTutor ? 3 : 4);
    } else if (step === 3) {
      if (!data.bio.trim()) { setError('La biografía es obligatoria para tutores.'); return; }
      if (!data.cvUrl.trim()) { setError('La URL de su CV/portafolio es obligatoria.'); return; }
      if (data.baseRate <= 0) { setError('La tarifa base debe ser mayor a 0.'); return; }
      setStep(4);
    } else if (step === 4) {
      if (data.categoryIds.length === 0) { setError('Seleccione al menos una categoría de interés.'); return; }
      await submit();
    }
  };

  const handleBack = () => {
    setError(null);
    // Estudiantes saltan el paso 3 (solo tutores) en ambas direcciones.
    if (step === 4 && !isTutor) { setStep(2); return; }
    if (step > 1) setStep((step - 1) as OnboardingStep);
  };

  return { step, data, update, categories, error, isLoading, handleNext, handleBack, isTutor };
};
