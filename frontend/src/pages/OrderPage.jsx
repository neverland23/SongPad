import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { orderNumber } from '../features/numbers/numbersSlice';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';

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

  const ordering = useAppSelector((state) => state.numbers.ordering);
  const error = useAppSelector((state) => state.numbers.error);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!phoneNumber) {
      navigate('/dashboard/numbers', { replace: true });
    }
  }, [phoneNumber, navigate]);

  const handleConfirm = async () => {
    const resultAction = await dispatch(
      orderNumber({ phoneNumber, countryCode, monthlyCost }),
    );
    if (orderNumber.fulfilled.match(resultAction)) {
      setStatus('Order successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard/numbers');
      }, 1200);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/numbers');
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-vh-100 d-flex align-items-center justify-content-center">
      <div className="bg-slate-800 rounded-3 shadow p-4 w-100" style={{ maxWidth: '520px' }}>
        <h1 className="h5 mb-3 text-center">Confirm Number Order</h1>
        <p className="text-slate-300 small mb-4 text-center">
          Please confirm the details below before purchasing this number.
        </p>
        <dl className="row small mb-3">
          <dt className="col-5 text-slate-400">Phone Number:</dt>
          <dd className="col-7">{phoneNumber}</dd>

          <dt className="col-5 text-slate-400">Country Code:</dt>
          <dd className="col-7">{countryCode || '-'}</dd>

          <dt className="col-5 text-slate-400">Estimated Monthly Cost:</dt>
          <dd className="col-7">
            {Number.isFinite(monthlyCost) ? `$${monthlyCost.toFixed(2)}` : 'N/A'}
          </dd>
        </dl>
        <ErrorMessage message={error} />
        <button
          type="button"
          className="btn btn-primary w-100 mb-2"
          onClick={handleConfirm}
          disabled={ordering}
        >
          {ordering ? 'Placing order…' : 'Confirm Order'}
        </button>
        <button type="button" className="btn btn-outline-light w-100" onClick={handleCancel}>
          Cancel
        </button>
        {ordering && (
          <div className="mt-3">
            <Loader label="Submitting order to Telnyx..." />
          </div>
        )}
        {status && (
          <p className="small mt-3 text-slate-300 text-center" id="orderStatus">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

export default OrderPage;
