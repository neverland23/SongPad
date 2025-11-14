import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchCountries,
  fetchMyNumbers,
  searchNumbers,
  selectCountries,
  selectAvailableNumbers,
  selectMyNumbers,
  selectNumbersError,
} from '../../features/numbers/numbersSlice';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';

function NumbersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const countries = useAppSelector(selectCountries);
  const availableNumbers = useAppSelector(selectAvailableNumbers);
  const myNumbers = useAppSelector(selectMyNumbers);
  const error = useAppSelector(selectNumbersError);
  const [selectedCountry, setSelectedCountry] = useState('');

  const loadingCountries = useAppSelector((state) => state.numbers.loadingCountries);
  const loadingAvailable = useAppSelector((state) => state.numbers.loadingAvailable);
  const loadingMyNumbers = useAppSelector((state) => state.numbers.loadingMyNumbers);

  useEffect(() => {
    dispatch(fetchCountries());
    dispatch(fetchMyNumbers());
  }, [dispatch]);

  const handleSearch = () => {
    if (!selectedCountry) return;
    dispatch(searchNumbers(selectedCountry));
  };

  const handleOrder = (num) => {
    const params = new URLSearchParams({
      phoneNumber: num.phoneNumber,
      countryCode: num.countryCode || '',
      monthlyCost: num.monthlyCost ?? 0,
    }).toString();
    navigate(`/order?${params}`);
  };

  return (
    <section id="numbersSection">
      <h2 className="h5 mb-3">Phone Number Order</h2>
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label">Select Country</label>
          <select
            className="form-select"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            <option value="">Choose a country...</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={handleSearch} disabled={!selectedCountry}>
            Search
          </button>
        </div>
      </div>
      {loadingCountries && <Loader label="Loading countries..." />}
      <ErrorMessage message={error} />
      <div className="mb-4">
        <h5>Available Numbers</h5>
        {loadingAvailable && <Loader label="Searching numbers..." />}
        <div className="table-responsive">
          <table className="table table-dark table-striped align-middle" id="numbersTable">
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Country</th>
                <th>Monthly Cost</th>
                <th>Capabilities</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {availableNumbers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 small">
                    No numbers loaded yet. Choose a country and search.
                  </td>
                </tr>
              )}
              {availableNumbers.map((num) => (
                <tr key={num.phoneNumber}>
                  <td>{num.phoneNumber}</td>
                  <td>{num.countryCode}</td>
                  <td>${(num.monthlyCost || 0).toFixed(2)}/month</td>
                  <td>{(num.capabilities || []).join(', ')}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => handleOrder(num)}
                    >
                      Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Your Numbers</h5>
          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            onClick={() => dispatch(fetchMyNumbers())}
          >
            Refresh
          </button>
        </div>
        {loadingMyNumbers && <Loader label="Loading your numbers..." />}
        <div className="table-responsive">
          <table className="table table-dark table-striped align-middle">
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Country</th>
                <th>Monthly Cost</th>
                <th>Capabilities</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {myNumbers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 small">
                    You have not ordered any numbers yet.
                  </td>
                </tr>
              )}
              {myNumbers.map((num) => (
                <tr key={num._id}>
                  <td>{num.phoneNumber}</td>
                  <td>{num.countryCode}</td>
                  <td>${(num.monthlyCost || 0).toFixed(2)}/month</td>
                  <td>{(num.capabilities || []).join(', ')}</td>
                  <td>{num.createdAt ? new Date(num.createdAt).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default NumbersPage;
