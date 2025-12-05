import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchCountries,
  fetchMyNumbers,
  searchNumbers,
  enableVoiceCall,
  deleteNumber,
  selectCountries,
  selectAvailableNumbers,
  selectMyNumbers,
  selectNumbersError,
} from '../../features/numbers/numbersSlice';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ConfirmModal from '../../components/ui/ConfirmModal';
import MultiSelect from '../../components/ui/MultiSelect';

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
  return features.filter((f) => f !== 'fax');
};

function NumbersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const countries = useAppSelector(selectCountries);
  const availableNumbers = useAppSelector(selectAvailableNumbers);
  const myNumbers = useAppSelector(selectMyNumbers);
  const error = useAppSelector(selectNumbersError);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [limit, setLimit] = useState('');

  // Available features options
  const featureOptions = [
    { value: 'sms', label: 'SMS messaging' },
    { value: 'mms', label: 'MMS messaging' },
    { value: 'voice', label: 'Voice calling' },
    { value: 'fax', label: 'Fax' },
    { value: 'emergency', label: 'Emergency calling' },
    { value: 'hd_voice', label: 'HD voice' },
  ];

  // Available type options
  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'local', label: 'Local/geographic' },
    { value: 'toll_free', label: 'Toll-free' },
  ];

  const loadingCountries = useAppSelector((state) => state.numbers.loadingCountries);
  const loadingAvailable = useAppSelector((state) => state.numbers.loadingAvailable);
  const loadingMyNumbers = useAppSelector((state) => state.numbers.loadingMyNumbers);
  const deleting = useAppSelector((state) => state.numbers.deleting);
  const enablingVoice = useAppSelector((state) => state.numbers.enablingVoice);
  
  const [deleteModal, setDeleteModal] = useState({ show: false, number: null });

  useEffect(() => {
    dispatch(fetchCountries());
    dispatch(fetchMyNumbers());
  }, [dispatch]);

  const handleSearch = () => {
    if (!selectedCountry) return;
    
    const searchParams = {
      countryCode: selectedCountry,
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
      type: selectedType || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };
    
    dispatch(searchNumbers(searchParams));
  };

  const handleFeatureChange = (values) => {
    setSelectedFeatures(values);
  };

  const handleOrder = (number) => {
    // Save full number details to localStorage
    localStorage.setItem('pendingOrderNumberDetails', JSON.stringify(number));
    
    const params = new URLSearchParams({
      phoneNumber: number.phone_number || '',
      countryCode: getCountry(number) || '',
      monthlyCost: getMonthlyCost(number),
      upfrontCost: getUpfrontCost(number) || '0',
    }).toString();
    navigate(`/order?${params}`);
  };

  const handleDeleteClick = (number) => {
    setDeleteModal({ show: true, number });
  };

  const handleDeleteConfirm = async () => {
    const { number } = deleteModal;
    if (!number) return;

    const phoneNumber = number.phone_number;
    if (phoneNumber) {
      await dispatch(deleteNumber(phoneNumber));
      // Refresh the list after deletion
      dispatch(fetchMyNumbers());
    }
    setDeleteModal({ show: false, number: null });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, number: null });
  };

  const handleEnableVoiceCall = async (number) => {
    const phoneNumber = number.phone_number || number.phoneNumber;
    if (!phoneNumber) return;

    try {
      await dispatch(enableVoiceCall(phoneNumber));
      // Refresh the list after enabling voice call
      dispatch(fetchMyNumbers());
    } catch (err) {
      console.error('Failed to enable voice call:', err);
    }
  };

  const getStatusBadgeColor = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    if (normalizedStatus === 'success' || normalizedStatus === 'active' || normalizedStatus === 'completed') {
      return 'bg-success';
    }
    if (normalizedStatus === 'deleted' || normalizedStatus === 'delete') {
      return 'bg-danger';
    }
    return 'bg-warning';
  };

  const isDeletedStatus = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    return normalizedStatus === 'deleted' || normalizedStatus === 'delete';
  };

  return (
    <section id="numbersSection">
      <h2 className="h5 mb-3">Phone Number Order</h2>
      <div className="row g-3 mb-3">
        <div className="col-md-3">
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
        <div className="col-md-3">
          <label className="form-label">Features</label>
          <MultiSelect
            options={featureOptions}
            selectedValues={selectedFeatures}
            onChange={handleFeatureChange}
            placeholder="Select features..."
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Type</label>
          <select
            className="form-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Limit</label>
          <input
            type="number"
            className="form-control"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Unlimited"
            min="1"
          />
          <small className="text-muted">Leave blank for unlimited</small>
        </div>
        <div className="col-md-9 d-flex align-items-end"></div>
        <div className="col-md-3 d-flex align-items-end">
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
          <div
            style={{
              maxHeight: '600px',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <table className="table table-dark table-striped align-middle mb-0" id="numbersTable">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#212529', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                <tr>
                  <th>Phone Number</th>
                  <th>Country</th>
                  <th>State</th>
                  <th>City / Rate Center</th>
                  <th>Features</th>
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
                      {formatFeatures(num).length > 0 ? (
                        formatFeatures(num).map((f, index) => (<span key={index} className="badge bg-info text-dark me-1">{f}</span>))
                      ) : (
                        <span className="badge bg-info text-dark me-1">None</span>
                      )}
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
                      <span className="text-white fw-bold small ms-1">
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
          <div
            style={{
              maxHeight: '600px',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <table className="table table-dark table-striped align-middle mb-0">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#212529', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                <tr>
                  <th>Phone Number</th>
                  <th>Country</th>
                  <th>State</th>
                  <th>City / Rate Center</th>
                  <th>Features</th>
                  <th>Fax</th>
                  <th>Monthly Cost</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
              {myNumbers.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-slate-400 small">
                    You have not ordered any numbers yet.
                  </td>
                </tr>
              )}
              {myNumbers.map((num, index) => (
                <tr key={num.phone_number || num.phone_number_id || num._id || index}>
                  <td className="fw-semibold">{num.phone_number || num.phoneNumber || 'N/A'}</td>
                  <td>{getCountry(num)}</td>
                  <td>{getState(num)}</td>
                  <td>{getRateCenter(num)}</td>
                  <td>
                    {formatFeatures(num).length > 0 ? (
                      formatFeatures(num).map((f, idx) => (
                        <span key={idx} className="badge bg-info text-dark me-1">
                          {f}
                        </span>
                      ))
                    ) : (
                      <span className="badge bg-info text-dark me-1">None</span>
                    )}
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
                      <span className="text-white fw-bold small ms-1">
                        {num.cost_information.currency}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      {num.status && (
                        <span className={`badge ${getStatusBadgeColor(num.status)}`}>
                          {num.status}
                        </span>
                      )}
                      {num.phone_number_status === 'active' && (
                        <span className="badge bg-info">
                          Voice call enabled
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {num.created_at
                      ? new Date(num.created_at).toLocaleString()
                      : num.createdAt
                      ? new Date(num.createdAt).toLocaleString()
                      : '—'}
                  </td>
                  <td className="text-center">
                    <div className="d-flex flex-column gap-1 align-items-center">
                      {!isDeletedStatus(num.status) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => handleDeleteClick(num)}
                          disabled={deleting}
                        >
                          Cancel
                        </button>
                      )}
                      {!num.phone_number_connection_id && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEnableVoiceCall(num)}
                          disabled={enablingVoice}
                        >
                          {enablingVoice ? 'Enabling...' : 'Enable Voice Call'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={deleteModal.show}
        title="Delete Phone Number"
        message={`Are you sure you want to delete ${deleteModal.number?.phone_number || deleteModal.number?.phoneNumber}?`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="btn-danger"
      />
    </section>
  );
}

export default NumbersPage;
