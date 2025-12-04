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

// Helper functions to extract data from API response
const getRegionInfo = (number, regionType) => {
  if (!number.region_information || !Array.isArray(number.region_information)) {
    return 'N/A';
  }
  const region = number.region_information.find((r) => r.region_type === regionType);
  return region ? region.region_name : 'N/A';
};

const getCountry = (number) => getRegionInfo(number, 'country_code');
const getState = (number) => getRegionInfo(number, 'state');
const getRateCenter = (number) => getRegionInfo(number, 'rate_center');

const getFeatures = (number) => {
  if (!number.features || !Array.isArray(number.features)) {
    return [];
  }
  return number.features.map((f) => f.name);
};

const hasFeature = (number, featureName) => {
  return getFeatures(number).includes(featureName);
};

const getMonthlyCost = (number) => {
  if (!number.cost_information || !number.cost_information.monthly_cost) {
    return '0.00';
  }
  return parseFloat(number.cost_information.monthly_cost).toFixed(2);
};

const getUpfrontCost = (number) => {
  if (!number.cost_information || !number.cost_information.upfront_cost) {
    return null;
  }
  return parseFloat(number.cost_information.upfront_cost).toFixed(2);
};

const formatFeatures = (number) => {
  const features = getFeatures(number);
  const voiceSms = features.filter((f) => f === 'voice' || f === 'sms');
  return voiceSms.length > 0 ? voiceSms.join(', ') : 'None';
};

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

  const handleOrder = (number) => {
    const params = new URLSearchParams({
      phoneNumber: number.phone_number || '',
      countryCode: getCountry(number) || '',
      monthlyCost: getMonthlyCost(number),
      upfrontCost: getUpfrontCost(number) || '0',
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
        {loadingAvailable && <Loader label="Searching phone numbers..." />}
        <div className="table-responsive">
          <table className="table table-dark table-striped align-middle" id="numbersTable">
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Country</th>
                <th>State</th>
                <th>City / Rate Center</th>
                <th>Features (Voice, SMS)</th>
                <th>Fax</th>
                <th>Monthly Cost</th>
                <th>Upfront Cost</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {availableNumbers.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-slate-400 small">
                    No numbers loaded yet. Choose a country and search.
                  </td>
                </tr>
              )}
              {availableNumbers.map((num, index) => (
                <tr key={num.phone_number || num.phoneNumber || index}>
                  <td className="fw-semibold">{num.phone_number || num.phoneNumber || 'N/A'}</td>
                  <td>{getCountry(num)}</td>
                  <td>{getState(num)}</td>
                  <td>{getRateCenter(num)}</td>
                  <td>
                    <span className="badge bg-info text-dark me-1">
                      {formatFeatures(num)}
                    </span>
                  </td>
                  <td>
                    {hasFeature(num, 'fax') ? (
                      <span className="badge bg-secondary">Yes</span>
                    ) : (
                      <span className="text-muted">No</span>
                    )}
                  </td>
                  <td>
                    <span className="fw-semibold">
                      ${getMonthlyCost(num)}/month
                    </span>
                    {num.cost_information?.currency && (
                      <span className="text-muted small ms-1">
                        {num.cost_information.currency}
                      </span>
                    )}
                  </td>
                  <td>
                    {getUpfrontCost(num) ? (
                      <span className="fw-semibold">${getUpfrontCost(num)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-center">
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
