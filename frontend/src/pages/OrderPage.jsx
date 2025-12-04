import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { orderNumber } from '../features/numbers/numbersSlice';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import ConfirmModal from '../components/ui/ConfirmModal';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

function OrderPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const query = useQuery();

  const phoneNumber = query.get('phoneNumber') || '';
  const countryCode = query.get('countryCode') || '';
  const monthlyCost = Number(query.get('monthlyCost') || 0);
  const upfrontCost = Number(query.get('upfrontCost') || 0);

  const ordering = useAppSelector((state) => state.numbers.ordering);
  const error = useAppSelector((state) => state.numbers.error);
  const [status, setStatus] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!phoneNumber) {
      navigate('/dashboard/numbers', { replace: true });
      return;
    }
    // Show modal automatically when page loads with valid phone number
    setShowConfirmModal(true);
  }, [phoneNumber, navigate]);

  const totalCost = monthlyCost + upfrontCost;

  const handleConfirmOrder = async () => {
    setShowConfirmModal(false);
    
    // Retrieve raw number details from localStorage
    let rawNumberDetails = null;
    try {
      const savedDetails = localStorage.getItem('pendingOrderNumberDetails');
      if (savedDetails) {
        rawNumberDetails = JSON.parse(savedDetails);
        // Remove from localStorage after retrieving
        localStorage.removeItem('pendingOrderNumberDetails');
      }
    } catch (err) {
      console.error('Error retrieving saved number details:', err);
    }
    
    const resultAction = await dispatch(
      orderNumber({ phoneNumber, countryCode, monthlyCost, rawNumberDetails }),
    );
    if (orderNumber.fulfilled.match(resultAction)) {
      setStatus('Order successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard/numbers');
      }, 1200);
    }
  };

  const handleCancelModal = () => {
    // Clean up localStorage if user cancels
    localStorage.removeItem('pendingOrderNumberDetails');
    navigate('/dashboard/numbers');
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-vh-100 d-flex align-items-center justify-content-center">
      {ordering && (
        <div className="text-center">
          <Loader label="Submitting order to Telnyx..." />
        </div>
      )}
      {status && !ordering && (
        <p className="small text-slate-300 text-center" id="orderStatus">
          {status}
        </p>
      )}
      <ErrorMessage message={error} />

      <ConfirmModal
        show={showConfirmModal}
        title="Confirm Order"
        message={
          <div>
            <p>Please confirm your order for:</p>
            <p className="fw-semibold mb-2">{phoneNumber}</p>
            <div className="border-top border-secondary pt-2 mt-2">
              <div className="d-flex justify-content-between mb-1">
                <span>Monthly Cost:</span>
                <span>${monthlyCost.toFixed(2)}</span>
              </div>
              {upfrontCost > 0 && (
                <div className="d-flex justify-content-between mb-1">
                  <span>Upfront Cost:</span>
                  <span>${upfrontCost.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between fw-bold border-top border-secondary pt-2 mt-2">
                <span>Total Cost:</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        }
        onConfirm={handleConfirmOrder}
        onCancel={handleCancelModal}
        confirmText="Confirm Order"
        cancelText="Cancel"
        confirmButtonClass="btn-primary"
      />
    </div>
  );
}

export default OrderPage;
