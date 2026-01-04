import { useNavigate } from 'react-router-dom';
import { useLoading } from '@/contexts/LoadingContext';

export const useNavigationWithLoading = () => {
  const navigate = useNavigate();
  const { showLoading } = useLoading();

  const navigateWithLoading = (path: string, delay: number = 0) => {
    showLoading();
    
    if (delay > 0) {
      setTimeout(() => {
        navigate(path);
      }, delay);
    } else {
      navigate(path);
    }
  };

  return { navigateWithLoading };
};