import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOnboardingWizard } from '../../hooks/useOnboardingWizard';
import { Button } from '../../components/ui/Button';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { StepPersonalInfo } from '../../components/onboarding/StepPersonalInfo';
import { StepAddress } from '../../components/onboarding/StepAddress';
import { StepTutorInfo } from '../../components/onboarding/StepTutorInfo';
import { StepCategories } from '../../components/onboarding/StepCategories';
import styles from './Onboarding.module.scss';

export const OnboardingPage = () => {
  const { user } = useAuth();
  const { step, data, update, categories, error, isLoading, handleNext, handleBack, isTutor } = useOnboardingWizard();

  // El usuario ya completó su perfil — no tiene nada que hacer aquí.
  if (user?.onboardingCompleted) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.onboarding}>
      <div className={styles.layout}>
        <OnboardingProgress step={step} isTutor={isTutor} />

        <div className={styles.container}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          {step === 1 && (
            <StepPersonalInfo
              userName={user?.name}
              isTutor={isTutor}
              phone={data.phone}
              gender={data.gender}
              onChangePhone={(value) => update('phone', value)}
              onChangeGender={(value) => update('gender', value)}
              idType={data.idType}
              idNumber={data.idNumber}
              onChangeIdType={(value) => update('idType', value)}
              onChangeIdNumber={(value) => update('idNumber', value)}
            />
          )}

          {step === 2 && (
            <StepAddress
              street={data.street}
              coords={data.coords}
              onChangeStreet={(value) => update('street', value)}
              onChangeCoords={(coords) => update('coords', coords)}
            />
          )}

          {step === 3 && isTutor && (
            <StepTutorInfo
              bio={data.bio}
              cvUrl={data.cvUrl}
              portfolioUrl={data.portfolioUrl}
              baseRate={data.baseRate}
              ratePerKm={data.ratePerKm}
              onChangeBio={(value) => update('bio', value)}
              onChangeCvUrl={(value) => update('cvUrl', value)}
              onChangePortfolioUrl={(value) => update('portfolioUrl', value)}
              onChangeBaseRate={(value) => update('baseRate', value)}
              onChangeRatePerKm={(value) => update('ratePerKm', value)}
            />
          )}

          {step === 4 && (
            <StepCategories
              categories={categories}
              selectedIds={data.categoryIds}
              isTutor={isTutor}
              onToggle={(categoryId) => {
                const next = data.categoryIds.includes(categoryId)
                  ? data.categoryIds.filter((id) => id !== categoryId)
                  : [...data.categoryIds, categoryId];
                update('categoryIds', next);
              }}
            />
          )}

          <div className={styles.actions}>
            {step > 1 && (
              <Button variant="secondary" onClick={handleBack} disabled={isLoading}>
                Atrás
              </Button>
            )}
            <Button onClick={handleNext} isLoading={isLoading}>
              {step === 4 ? 'Finalizar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
